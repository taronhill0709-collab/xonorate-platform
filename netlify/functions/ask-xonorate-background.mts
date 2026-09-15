import { answerAskQuestion } from "../../src/lib/ask-xonorate";
import { setAskXonorateJobStatus } from "../../src/lib/ask-xonorate-jobs";

// Background function: 15-minute execution budget (vs 30s for regular
// functions). High-effort structured generation over a full retrieved
// context can run past a synchronous Server Action's ~10s budget — same
// class of problem content-draft-background.mts already exists to solve,
// so this follows the same trigger/background split. Triggered by the
// startAskXonorate Server Action (src/app/ask/actions.ts), never called
// directly by a visitor.
async function handler(req: Request) {
  const secret = req.headers.get("x-internal-job-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[ask-xonorate-background] rejected: missing or invalid secret");
    return;
  }

  const { jobId, question, jurisdiction, sessionToken } = (await req.json()) as {
    jobId?: string;
    question?: string;
    jurisdiction?: string | null;
    sessionToken?: string | null;
  };
  if (!jobId || !question) {
    console.error("[ask-xonorate-background] missing jobId or question");
    return;
  }

  try {
    const { questionId, answer } = await answerAskQuestion(question, jurisdiction ?? null, sessionToken ?? null);
    await setAskXonorateJobStatus(jobId, { status: "done", questionId, answer });
    console.log(`[ask-xonorate-background] answered question ${questionId} (job ${jobId})`);
  } catch (err) {
    console.error(`[ask-xonorate-background] failed (${jobId})`, err);
    await setAskXonorateJobStatus(jobId, {
      status: "failed",
      error: "Couldn't research an answer just now. Try again in a moment.",
    });
  }
}

export default handler;
