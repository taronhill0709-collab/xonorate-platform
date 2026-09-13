import { draftContentBody, type ContentDraftInput } from "../../src/lib/content-draft";
import { setContentDraftJobStatus } from "../../src/lib/content-draft-jobs";
import { classifySource } from "../../src/lib/source-classify";

// Background function: 15-minute execution budget (vs 30s for regular
// functions). Analysis/Explainer drafts use web_search at high effort and
// reliably take 20-40+ seconds, confirmed live to crash a regular
// Server Action/page render ("An unexpected response was received from the
// server"). Same class of problem daily-content-background/
// case-overview-extract-background already exist to solve, so this follows
// the same trigger/background split. Triggered by the startContentDraft
// Server Action (posts/actions.ts), not called directly by users.
async function handler(req: Request) {
  const secret = req.headers.get("x-internal-job-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[content-draft-background] rejected: missing or invalid secret");
    return;
  }

  const { jobId, input, classify } = (await req.json()) as {
    jobId?: string;
    input?: ContentDraftInput;
    classify?: boolean;
  };
  if (!jobId || !input) {
    console.error("[content-draft-background] missing jobId or input");
    return;
  }

  try {
    // classify is only requested for a source the editor typed in
    // themselves (never discovered, so never run through content-pipeline's
    // enrichStory) — an Intelligence-sourced item is already classified.
    const [body, classification] = await Promise.all([
      draftContentBody(input),
      classify ? classifySource(input) : Promise.resolve(undefined),
    ]);
    await setContentDraftJobStatus(jobId, { status: "done", body, classification });
    console.log(`[content-draft-background] drafted "${input.type}" body for "${input.headline}" (${jobId})`);
  } catch (err) {
    console.error(`[content-draft-background] drafting failed (${jobId})`, err);
    await setContentDraftJobStatus(jobId, { status: "failed", error: "Couldn't generate a draft. Try again." });
  }
}

export default handler;
