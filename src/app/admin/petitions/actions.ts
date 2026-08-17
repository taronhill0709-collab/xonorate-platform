"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  cases,
  petitionSlugHistory,
  petitionStatusEnum,
  petitions,
  petitionUpdates,
  signatures,
} from "@/db/schema";
import { sendPetitionUpdateEmail } from "@/lib/petition-update-email";
import { getOrigin } from "@/lib/request-ip";
import { requireAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";
import { insertWithUniqueSlug, updateWithUniqueSlug } from "@/lib/unique-slug";

const petitionFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  recipientName: z.string().optional(),
  askText: z.string().min(1),
  goalCount: z.coerce.number().int().positive(),
  startingSignatureCount: z.coerce.number().int().nonnegative().optional(),
  caseId: z.string().optional(),
  status: z.enum(petitionStatusEnum.enumValues).optional(),
});

function parsePetitionForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = petitionFormSchema.parse(raw);
  return {
    title: parsed.title,
    slugInput: parsed.slug?.trim() || parsed.title,
    recipientName: parsed.recipientName?.trim() || null,
    askText: parsed.askText,
    goalCount: parsed.goalCount,
    startingSignatureCount: parsed.startingSignatureCount ?? 0,
    caseId: parsed.caseId || null,
    status: parsed.status ?? "draft",
  };
}

export async function createPetition(formData: FormData) {
  await requireAdmin();
  const data = parsePetitionForm(formData);

  const row = await insertWithUniqueSlug(data.slugInput, (slug) =>
    db
      .insert(petitions)
      .values({
        title: data.title,
        slug,
        recipientName: data.recipientName,
        askText: data.askText,
        goalCount: data.goalCount,
        startingSignatureCount: data.startingSignatureCount,
        caseId: data.caseId,
        status: data.status,
      })
      .returning({ id: petitions.id }),
  );

  revalidatePath("/admin/petitions");
  redirect(`/admin/petitions/${row.id}/edit`);
}

export async function updatePetition(petitionId: string, formData: FormData) {
  await requireAdmin();
  const data = parsePetitionForm(formData);

  const [current] = await db
    .select({ slug: petitions.slug })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  const baseFields = {
    title: data.title,
    recipientName: data.recipientName,
    askText: data.askText,
    goalCount: data.goalCount,
    startingSignatureCount: data.startingSignatureCount,
    caseId: data.caseId,
    status: data.status,
  };

  const requestedSlug = slugify(data.slugInput);
  let finalSlug = current?.slug ?? requestedSlug;

  if (current && requestedSlug && requestedSlug !== current.slug) {
    finalSlug = await updateWithUniqueSlug(requestedSlug, (slug) =>
      db
        .update(petitions)
        .set({ ...baseFields, slug })
        .where(eq(petitions.id, petitionId))
        .returning({ id: petitions.id }),
    );
    // Old links (social posts, emails, print materials) keep working —
    // onConflictDoNothing so re-using a slug that's already someone else's
    // redirect target doesn't hijack it.
    await db
      .insert(petitionSlugHistory)
      .values({ petitionId, oldSlug: current.slug })
      .onConflictDoNothing();
  } else {
    await db.update(petitions).set(baseFields).where(eq(petitions.id, petitionId));
  }

  revalidatePath("/admin/petitions");
  revalidatePath(`/admin/petitions/${petitionId}/edit`);
  revalidatePath(`/petitions/${finalSlug}`);
  if (current && current.slug !== finalSlug) revalidatePath(`/petitions/${current.slug}`);
  redirect(`/admin/petitions/${petitionId}/edit?saved=1`);
}

export async function updatePetitionStatus(
  petitionId: string,
  status: (typeof petitionStatusEnum.enumValues)[number],
) {
  await requireAdmin();

  const [row] = await db
    .select({ slug: petitions.slug, caseId: petitions.caseId })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  await db.update(petitions).set({ status }).where(eq(petitions.id, petitionId));

  revalidatePath("/admin/petitions");
  revalidatePath("/petitions");
  revalidatePath("/");
  if (row) {
    revalidatePath(`/petitions/${row.slug}`);
    if (row.caseId) {
      const [caseRow] = await db
        .select({ slug: cases.slug })
        .from(cases)
        .where(eq(cases.id, row.caseId))
        .limit(1);
      if (caseRow) revalidatePath(`/cases/${caseRow.slug}`);
    }
  }
  redirect("/admin/petitions?saved=1");
}

/** Permanently deletes a petition and, via the FK cascade, every signature
 * on it — the confirm dialog on the delete button is the only guard against
 * an accidental click, so this stays destructive on purpose rather than a
 * soft-delete the schema doesn't otherwise support. */
export async function deletePetition(petitionId: string) {
  await requireAdmin();

  const [row] = await db
    .select({ slug: petitions.slug, caseId: petitions.caseId })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  await db.delete(petitions).where(eq(petitions.id, petitionId));

  revalidatePath("/admin/petitions");
  revalidatePath("/petitions");
  revalidatePath("/");
  if (row) {
    revalidatePath(`/petitions/${row.slug}`);
    if (row.caseId) {
      const [caseRow] = await db
        .select({ slug: cases.slug })
        .from(cases)
        .where(eq(cases.id, row.caseId))
        .limit(1);
      if (caseRow) revalidatePath(`/cases/${caseRow.slug}`);
    }
  }
  redirect("/admin/petitions?saved=deleted");
}

const updateFormSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  notifySigners: z.string().optional(),
});

export async function addPetitionUpdate(petitionId: string, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const data = updateFormSchema.parse(raw);
  const notifySigners = data.notifySigners === "on";

  await db.insert(petitionUpdates).values({
    petitionId,
    title: data.title,
    body: data.body,
  });

  const [petition] = await db
    .select({ title: petitions.title, slug: petitions.slug })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  revalidatePath(`/admin/petitions/${petitionId}/edit`);
  if (petition) revalidatePath(`/petitions/${petition.slug}`);

  if (!notifySigners || !petition) {
    redirect(`/admin/petitions/${petitionId}/edit?saved=1`);
  }

  const signers = await db
    .select({ email: signatures.email, displayName: signatures.displayName })
    .from(signatures)
    .where(and(eq(signatures.petitionId, petitionId), eq(signatures.verified, true)));

  const origin = await getOrigin();
  const petitionUrl = `${origin}/petitions/${petition.slug}`;

  const results = await Promise.allSettled(
    signers.map((s) =>
      sendPetitionUpdateEmail({
        to: s.email,
        displayName: s.displayName,
        petitionTitle: petition.title,
        petitionUrl,
        updateTitle: data.title,
        updateBody: data.body,
      }),
    ),
  );
  const notified = results.filter((r) => r.status === "fulfilled").length;

  redirect(`/admin/petitions/${petitionId}/edit?notified=${notified}`);
}

export async function deletePetitionUpdate(petitionId: string, updateId: string) {
  await requireAdmin();
  await db.delete(petitionUpdates).where(eq(petitionUpdates.id, updateId));

  const [row] = await db
    .select({ slug: petitions.slug })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  revalidatePath(`/admin/petitions/${petitionId}/edit`);
  if (row) revalidatePath(`/petitions/${row.slug}`);
  redirect(`/admin/petitions/${petitionId}/edit?saved=deleted`);
}
