"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { petitions } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

const petitionFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  askText: z.string().min(1),
  goalCount: z.coerce.number().int().positive(),
  startingSignatureCount: z.coerce.number().int().nonnegative().optional(),
  caseId: z.string().optional(),
});

function parsePetitionForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = petitionFormSchema.parse(raw);
  return {
    title: parsed.title,
    slugInput: parsed.slug?.trim() || parsed.title,
    askText: parsed.askText,
    goalCount: parsed.goalCount,
    startingSignatureCount: parsed.startingSignatureCount ?? 0,
    caseId: parsed.caseId || null,
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
        askText: data.askText,
        goalCount: data.goalCount,
        startingSignatureCount: data.startingSignatureCount,
        caseId: data.caseId,
      })
      .returning({ id: petitions.id }),
  );

  revalidatePath("/admin/petitions");
  redirect(`/admin/petitions/${row.id}/edit`);
}

export async function updatePetition(petitionId: string, formData: FormData) {
  await requireAdmin();
  const data = parsePetitionForm(formData);

  await db
    .update(petitions)
    .set({
      title: data.title,
      askText: data.askText,
      goalCount: data.goalCount,
      startingSignatureCount: data.startingSignatureCount,
      caseId: data.caseId,
    })
    .where(eq(petitions.id, petitionId));

  const [row] = await db
    .select({ slug: petitions.slug })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);

  revalidatePath("/admin/petitions");
  revalidatePath(`/admin/petitions/${petitionId}/edit`);
  if (row) revalidatePath(`/petitions/${row.slug}`);
  redirect(`/admin/petitions/${petitionId}/edit?saved=1`);
}
