"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteNote, updateNote } from "@/family/notes";
import { familyNoteVisibilityEnum } from "@/db/schema";

const schema = z.object({
  body: z.string().trim().min(1, "Please write something."),
  visibility: z.enum(familyNoteVisibilityEnum.enumValues),
  lovedOneId: z.string().optional(),
});

export async function updateNoteAction(
  familyId: string,
  noteId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { body, visibility, lovedOneId } = parsed.data;

  const updated = await updateNote(familyId, noteId, membership.session.user.id, {
    body,
    visibility,
    lovedOneId: lovedOneId || null,
  });
  if (!updated) return { success: false, error: "Note not found." };

  revalidatePath(`/family/${familyId}/notes`);
  return { success: true };
}

export async function deleteNoteAction(
  familyId: string,
  noteId: string,
): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const removed = await deleteNote(familyId, noteId, membership.session.user.id);
  revalidatePath(`/family/${familyId}/notes`);
  return { success: Boolean(removed) };
}
