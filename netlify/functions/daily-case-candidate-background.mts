import { generateDailyCaseCandidate } from "../../src/lib/case-candidate-pipeline";

// Background function: 15-minute execution budget, same reasoning as
// daily-content-background.mts (web-search research reliably runs well past
// a regular function's 30s budget). Triggered by
// daily-case-candidate-trigger.mts, not called directly by users.
async function handler(req: Request) {
  const secret = req.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[daily-case-candidate-background] rejected: missing or invalid secret");
    return;
  }

  try {
    const result = await generateDailyCaseCandidate();
    if (result) {
      console.log(
        `[daily-case-candidate-background] staged candidate "${result.clientName}" (${result.id}) — pending admin review`,
      );
    } else {
      console.log("[daily-case-candidate-background] no suitable candidate found today");
    }
  } catch (err) {
    console.error("[daily-case-candidate-background] research failed", err);
  }
}

export default handler;
