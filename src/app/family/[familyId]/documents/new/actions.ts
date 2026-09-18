"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { InvalidDocumentError, uploadFamilyDocument } from "@/family/documents";
import { familyDocumentCategoryEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  category: z.enum(familyDocumentCategoryEnum.enumValues),
  lovedOneId: z.string().optional(),
  tags: z.string().optional(),
});

export async function uploadDocumentAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose a file." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, category, lovedOneId, tags } = parsed.data;

  try {
    await uploadFamilyDocument({
      familyId,
      lovedOneId: lovedOneId || null,
      uploadedByUserId: membership.session.user.id,
      category,
      title,
      file,
      tags: tags
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : null,
    });
  } catch (err) {
    if (err instanceof InvalidDocumentError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  revalidatePath(`/family/${familyId}/documents`);
  revalidatePath(`/family/${familyId}`);
  return { success: true };
}
