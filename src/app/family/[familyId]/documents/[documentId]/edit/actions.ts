"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteFamilyDocument, updateFamilyDocument } from "@/family/documents";
import { familyDocumentCategoryEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  category: z.enum(familyDocumentCategoryEnum.enumValues),
  lovedOneId: z.string().optional(),
  tags: z.string().optional(),
});

export async function updateDocumentAction(
  familyId: string,
  documentId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, category, lovedOneId, tags } = parsed.data;

  const updated = await updateFamilyDocument(familyId, documentId, {
    title,
    category,
    lovedOneId: lovedOneId || null,
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
  });
  if (!updated) return { success: false, error: "Document not found." };

  revalidatePath(`/family/${familyId}/documents`);
  return { success: true };
}

export async function deleteDocumentAction(
  familyId: string,
  documentId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteFamilyDocument(familyId, documentId);
  revalidatePath(`/family/${familyId}/documents`);
  revalidatePath(`/family/${familyId}`);
  return { success: Boolean(removed) };
}
