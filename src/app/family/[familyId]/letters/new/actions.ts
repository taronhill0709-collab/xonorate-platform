"use server";

import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createSupportLetterDraft } from "@/family/support-letters";
import { supportLetterPurposeEnum } from "@/db/schema";

const schema = z.object({
  lovedOneId: z.string().min(1, "Please choose a loved one."),
  purpose: z.enum(supportLetterPurposeEnum.enumValues),
  recipientName: z.string().trim().optional(),
});

export async function createSupportLetterAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true; letterId: string } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { lovedOneId, purpose, recipientName } = parsed.data;

  const letter = await createSupportLetterDraft(familyId, lovedOneId, membership.session.user.id, {
    purpose,
    recipientName: recipientName || null,
  });

  return { success: true, letterId: letter.id };
}
