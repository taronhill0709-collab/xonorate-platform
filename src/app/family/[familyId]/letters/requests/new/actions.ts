"use server";

import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createLetterRequest } from "@/family/support-letter-requests";
import { supportLetterPurposeEnum } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";

const schema = z.object({
  lovedOneId: z.string().min(1, "Please choose a loved one."),
  purpose: z.enum(supportLetterPurposeEnum.enumValues),
  recipientName: z.string().trim().optional(),
  inviteeName: z.string().trim().min(1, "Please enter their name."),
  inviteeEmail: z.email(),
  personalNote: z.string().trim().optional(),
});

export async function createLetterRequestAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { lovedOneId, purpose, recipientName, inviteeName, inviteeEmail, personalNote } = parsed.data;

  const origin = await getOrigin();
  await createLetterRequest({
    familyId,
    lovedOneId,
    requestedByUserId: membership.session.user.id,
    purpose,
    recipientName: recipientName || null,
    inviteeName,
    inviteeEmail,
    personalNote: personalNote || null,
    inviteUrl: (token) => `${origin}/letter-request/${token}`,
  });

  return { success: true };
}
