"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyOwner } from "@/family/authz";
import { getFamily } from "@/family/families";
import { inviteFamilyMember, removeFamilyMember, type InviteResult } from "@/family/invites";
import { getOrigin } from "@/lib/request-ip";

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["owner", "member"]),
});

export async function inviteMemberAction(
  familyId: string,
  formData: FormData,
): Promise<InviteResult> {
  await requireFamilyOwner(familyId);

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const family = await getFamily(familyId);
  if (!family) return { success: false, error: "Family not found." };

  const origin = await getOrigin();
  const result = await inviteFamilyMember({
    familyId,
    familyName: family.name,
    email: parsed.data.email,
    role: parsed.data.role,
    inviteUrl: (token) => `${origin}/family/invite/${token}`,
  });

  if (result.success) revalidatePath(`/family/${familyId}/members`);
  return result;
}

export async function removeMemberAction(
  familyId: string,
  familyMemberId: string,
): Promise<{ success: boolean }> {
  await requireFamilyOwner(familyId);
  const removed = await removeFamilyMember(familyId, familyMemberId);
  revalidatePath(`/family/${familyId}/members`);
  return { success: Boolean(removed) };
}
