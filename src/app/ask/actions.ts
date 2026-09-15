"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { askQuestions } from "@/db/schema";
import { getAskXonorateJobStatus, setAskXonorateJobStatus, type AskXonorateJobStatus } from "@/lib/ask-xonorate-jobs";

export type StartAskXonorateResult = { ok: true; jobId: string } | { ok: false; error: string };

const MAX_QUESTION_LENGTH = 1500;

/** Public entry point — deliberately not requireAdmin()-gated, unlike the
 * editorial content-draft job dispatcher this mirrors. Ask Xonorate is a
 * visitor-facing feature (spec §1). */
export async function startAskXonorate(question: string, jurisdiction?: string | null): Promise<StartAskXonorateResult> {
  const trimmed = question.trim();
  if (!trimmed) return { ok: false, error: "Ask a question first." };
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `Keep the question under ${MAX_QUESTION_LENGTH} characters.` };
  }

  const jobId = crypto.randomUUID();
  await setAskXonorateJobStatus(jobId, { status: "pending" });

  const origin = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.DAILY_CONTENT_SECRET;
  if (!origin || !secret) {
    console.error("startAskXonorate: missing URL or DAILY_CONTENT_SECRET env var");
    return { ok: false, error: "Ask Xonorate isn't configured on this deploy yet." };
  }

  try {
    await fetch(`${origin}/.netlify/functions/ask-xonorate-background`, {
      method: "POST",
      headers: { "x-internal-job-secret": secret, "content-type": "application/json" },
      body: JSON.stringify({ jobId, question: trimmed, jurisdiction: jurisdiction ?? null, sessionToken: null }),
    });
  } catch (err) {
    console.error("startAskXonorate: failed to dispatch background job", err);
    return { ok: false, error: "Couldn't start research. Try again." };
  }

  return { ok: true, jobId };
}

export async function getAskXonorateStatus(jobId: string): Promise<AskXonorateJobStatus> {
  return getAskXonorateJobStatus(jobId);
}

/** Visitor-facing "was this helpful / report an issue" — feeds the admin
 * quality dashboard's flagged-answers queue (spec §26). Never exposes one
 * visitor's flag to another; this only ever touches the row by id. */
export async function flagAskAnswer(questionId: string, note?: string): Promise<void> {
  await db
    .update(askQuestions)
    .set({ flaggedForReview: true, flagNote: note?.trim() || null })
    .where(eq(askQuestions.id, questionId));
}
