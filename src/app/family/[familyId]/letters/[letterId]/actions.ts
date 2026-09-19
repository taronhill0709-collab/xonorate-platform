"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyMember } from "@/family/authz";
import { AIRefusalError } from "@/family/ai";
import {
  approveSupportLetter,
  deleteSupportLetter,
  regenerateSupportLetterDraft,
  updateSupportLetterAnswers,
  updateSupportLetterContent,
} from "@/family/support-letters";

export async function saveAnswersAction(
  familyId: string,
  letterId: string,
  formData: FormData,
): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const answers = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
  const result = await updateSupportLetterAnswers(familyId, letterId, membership.session.user.id, answers);
  revalidatePath(`/family/${familyId}/letters/${letterId}`);
  return { success: Boolean(result) };
}

export async function generateDraftAction(
  familyId: string,
  letterId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);
  const authorName = membership.session.user.name || membership.session.user.email || "Family Member";

  try {
    const result = await regenerateSupportLetterDraft(familyId, letterId, membership.session.user.id, authorName);
    if (!result) return { success: false, error: "Letter not found." };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't draft this letter — please review your answers and try again." };
    }
    throw err;
  }

  revalidatePath(`/family/${familyId}/letters/${letterId}`);
  revalidatePath(`/family/${familyId}/letters`);
  return { success: true };
}

export async function saveEditsAction(
  familyId: string,
  letterId: string,
  content: string,
): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const result = await updateSupportLetterContent(familyId, letterId, membership.session.user.id, content);
  revalidatePath(`/family/${familyId}/letters/${letterId}`);
  revalidatePath(`/family/${familyId}/letters`);
  return { success: Boolean(result) };
}

export async function approveAction(familyId: string, letterId: string): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const result = await approveSupportLetter(familyId, letterId, membership.session.user.id);
  revalidatePath(`/family/${familyId}/letters/${letterId}`);
  revalidatePath(`/family/${familyId}/letters`);
  return { success: Boolean(result) };
}

export async function deleteLetterAction(familyId: string, letterId: string): Promise<{ success: boolean }> {
  const membership = await requireFamilyMember(familyId);
  const result = await deleteSupportLetter(familyId, letterId, membership.session.user.id);
  revalidatePath(`/family/${familyId}/letters`);
  return { success: Boolean(result) };
}
