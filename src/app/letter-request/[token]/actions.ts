"use server";

import { AIRefusalError } from "@/family/ai";
import {
  approveLetterRequest,
  generateLetterRequestDraft,
  saveLetterRequestAnswers,
  updateLetterRequestContent,
} from "@/family/support-letter-requests";

// No auth of any kind here beyond the token itself — see
// support-letter-requests.ts's header comment and docs/SECURITY.md. This
// is intentional: the invitee has no Xonorate account.

export async function saveAnswersAction(
  token: string,
  formData: FormData,
): Promise<{ success: boolean }> {
  const answers = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  );
  const result = await saveLetterRequestAnswers(token, answers);
  return { success: Boolean(result) };
}

export async function generateDraftAction(
  token: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const result = await generateLetterRequestDraft(token);
    if (!result) return { success: false, error: "This invitation link is no longer valid." };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't draft this letter — please review your answers and try again." };
    }
    throw err;
  }
  return { success: true };
}

export async function saveEditsAction(token: string, content: string): Promise<{ success: boolean }> {
  const result = await updateLetterRequestContent(token, content);
  return { success: Boolean(result) };
}

export async function approveAction(token: string): Promise<{ success: boolean }> {
  const result = await approveLetterRequest(token);
  return { success: Boolean(result) };
}
