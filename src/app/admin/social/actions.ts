"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { SOCIAL_POSTS_COOKIE } from "./constants";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { buildSocialCaption } from "@/lib/social-caption";
import { getPostMetrics, postToInstagram } from "@/lib/buffer";

export async function setSocialPostsEnabled(enabled: boolean) {
  await requireAdmin();
  const store = await cookies();
  store.set(SOCIAL_POSTS_COOKIE, enabled ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/admin",
  });
  revalidatePath("/admin/social");
  redirect("/admin/social?saved=1");
}

export type PostToSocialResult = { ok: true } | { ok: false; error: string };

type ExonerationDetails = { whatLedToExoneration: string; year: number } | null;

/** Publishes an exonerated case's caption + photo to Instagram via Buffer,
 * which cross-posts to Facebook automatically. Guarded by `postedToSocialAt`
 * so a double-click (or a second admin) can't push the same case twice. */
export async function postToInstagramAndFacebook(
  caseId: string,
): Promise<PostToSocialResult> {
  await requireAdmin();

  const [row] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!row) {
    return { ok: false, error: "Case not found" };
  }
  if (row.status !== "exonerated") {
    return { ok: false, error: "Only exonerated cases can be shared to social" };
  }
  if (row.postedToSocialAt) {
    return {
      ok: false,
      error: `Already posted on ${row.postedToSocialAt.toLocaleDateString("en-US")}`,
    };
  }
  if (!row.photoUrl) {
    return { ok: false, error: "This case has no photo — Instagram requires an image" };
  }

  // Atomically claim the case before calling Buffer — if two requests race
  // (double-click, two admins), only one UPDATE can match `postedToSocialAt
  // IS NULL` and actually publish.
  const [claimed] = await db
    .update(cases)
    .set({ postedToSocialAt: new Date() })
    .where(and(eq(cases.id, caseId), isNull(cases.postedToSocialAt)))
    .returning({ id: cases.id });
  if (!claimed) {
    return { ok: false, error: "Already posted (claimed by a concurrent request)" };
  }

  const origin = await getOrigin();
  const exoneration = row.exonerationDetails as ExonerationDetails;
  const caption = buildSocialCaption({
    clientName: row.clientName,
    state: row.state,
    excerpt: exoneration?.whatLedToExoneration || row.summary,
    origin,
    slug: row.slug,
  });

  const result = await postToInstagram({ text: caption, imageUrl: row.photoUrl });
  if (!result.ok) {
    // Publishing failed — release the claim so the button becomes available
    // again instead of permanently showing "already posted" for a case that
    // never actually went out.
    await db
      .update(cases)
      .set({ postedToSocialAt: null })
      .where(eq(cases.id, caseId));
    return { ok: false, error: result.error };
  }

  await db
    .update(cases)
    .set({ bufferPostId: result.bufferPostId })
    .where(eq(cases.id, caseId));

  revalidatePath("/admin/social");
  return { ok: true };
}

export type RefreshMetricsResult =
  | { ok: true; refreshed: number; failed: number }
  | { ok: false; error: string };

/** Pulls fresh impression counts from Buffer for every case we've shared to
 * social, and caches them on the case row. Buffer only updates these ~daily
 * on their end, so there's no value in calling this more than occasionally. */
export async function refreshSocialMetrics(): Promise<RefreshMetricsResult> {
  await requireAdmin();

  const withBufferId = await db
    .select({ id: cases.id, bufferPostId: cases.bufferPostId })
    .from(cases)
    .where(isNotNull(cases.bufferPostId));

  let refreshed = 0;
  let failed = 0;

  for (const row of withBufferId) {
    if (!row.bufferPostId) continue;
    const metrics = await getPostMetrics(row.bufferPostId);
    if (!metrics.ok || metrics.impressions == null) {
      failed += 1;
      continue;
    }
    await db
      .update(cases)
      .set({
        socialViews: metrics.impressions,
        socialMetricsSyncedAt: new Date(),
      })
      .where(eq(cases.id, row.id));
    refreshed += 1;
  }

  revalidatePath("/admin/social");
  revalidatePath("/admin/cases");
  revalidatePath("/");
  revalidatePath("/exonerated");

  return { ok: true, refreshed, failed };
}
