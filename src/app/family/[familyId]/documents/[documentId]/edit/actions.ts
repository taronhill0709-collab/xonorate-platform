"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteFamilyDocument, updateFamilyDocument } from "@/family/documents";
import { familyDocumentCategoryEnum, dateConfidenceEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  category: z.enum(familyDocumentCategoryEnum.enumValues),
  lovedOneId: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().trim().optional(),
  documentDate: z.string().optional(),
  documentDateConfidence: z.enum(dateConfidenceEnum.enumValues),
  relatedTimelineEventId: z.string().optional(),
  relatedPersonId: z.string().optional(),
  notes: z.string().trim().optional(),
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
  const {
    title,
    category,
    lovedOneId,
    tags,
    description,
    documentDate,
    documentDateConfidence,
    relatedTimelineEventId,
    relatedPersonId,
    notes,
  } = parsed.data;

  const updated = await updateFamilyDocument(familyId, documentId, {
    title,
    category,
    lovedOneId: lovedOneId || null,
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    description: description || null,
    documentDate: documentDateConfidence === "unknown" || !documentDate ? null : documentDate,
    documentDateConfidence,
    relatedTimelineEventId: relatedTimelineEventId || null,
    relatedPersonId: relatedPersonId || null,
    notes: notes || null,
  });
  if (!updated) return { success: false, error: "Document not found." };

  revalidatePath(`/family/${familyId}/documents`);
  if (lovedOneId) revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
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
