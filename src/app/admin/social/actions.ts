"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { SOCIAL_POSTS_COOKIE } from "./constants";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { buildSocialCaption } from "@/lib/social-caption";
import { postToInstagram } from "@/lib/buffer";

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
}

export type PostToSocialResult = { ok: true } | { ok: false; error: string };

/** Publishes a post's caption + photo to Instagram via Buffer, which
 * cross-posts to Facebook automatically. Guarded by `postedToSocialAt` so a
 * double-click (or a second admin) can't push the same post twice. */
export async function postToInstagramAndFacebook(
  postId: string,
): Promise<PostToSocialResult> {
  await requireAdmin();

  const [row] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!row) {
    return { ok: false, error: "Post not found" };
  }
  if (row.status !== "published") {
    return { ok: false, error: "Only published posts can be shared to social" };
  }
  if (row.postedToSocialAt) {
    return {
      ok: false,
      error: `Already posted on ${row.postedToSocialAt.toLocaleDateString("en-US")}`,
    };
  }
  if (!row.imageUrl) {
    return { ok: false, error: "This post has no photo — Instagram requires an image" };
  }

  // Atomically claim the post before calling Buffer — if two requests race
  // (double-click, two admins), only one UPDATE can match `postedToSocialAt
  // IS NULL` and actually publish.
  const [claimed] = await db
    .update(posts)
    .set({ postedToSocialAt: new Date() })
    .where(and(eq(posts.id, postId), isNull(posts.postedToSocialAt)))
    .returning({ id: posts.id });
  if (!claimed) {
    return { ok: false, error: "Already posted (claimed by a concurrent request)" };
  }

  const origin = await getOrigin();
  const caption = buildSocialCaption({
    title: row.title,
    body: row.body,
    origin,
    slug: row.slug,
  });

  const result = await postToInstagram({ text: caption, imageUrl: row.imageUrl });
  if (!result.ok) {
    // Publishing failed — release the claim so the button becomes available
    // again instead of permanently showing "already posted" for a post that
    // never actually went out.
    await db
      .update(posts)
      .set({ postedToSocialAt: null })
      .where(eq(posts.id, postId));
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/social");
  return { ok: true };
}
