"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyMember } from "@/family/authz";
import { deleteLetterRequest } from "@/family/support-letter-requests";

export async function cancelLetterRequestAction(
  familyId: string,
  requestId: string,
): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const result = await deleteLetterRequest(familyId, requestId, membership.session.user.id);
  revalidatePath(`/family/${familyId}/letters`);
  return { success: Boolean(result) };
}
