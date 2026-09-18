"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createNote } from "@/family/notes";
import { familyNoteVisibilityEnum } from "@/db/schema";

const schema = z.object({
  body: z.string().trim().min(1, "Please write something."),
  visibility: z.enum(familyNoteVisibilityEnum.enumValues),
  lovedOneId: z.string().optional(),
});

export async function createNoteAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { body, visibility, lovedOneId } = parsed.data;

  await createNote(familyId, membership.session.user.id, {
    body,
    visibility,
    lovedOneId: lovedOneId || null,
  });

  revalidatePath(`/family/${familyId}/notes`);
  return { success: true };
}
