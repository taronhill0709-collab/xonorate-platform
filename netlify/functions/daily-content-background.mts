import { generateDailyPost } from "../../src/lib/content-pipeline";

// Number of independent draft candidates to generate per run, so the admin
// has a few real options to choose from rather than one take-it-or-leave-it
// draft. Each call re-queries spotlight eligibility fresh, so if a case
// qualifies it's only spotlighted once per batch — later calls in the same
// batch naturally fall back to roundups instead of repeating it.
const CANDIDATES_PER_RUN = 3;

// Background function: 15-minute execution budget (vs 30s for regular/scheduled
// functions), which the research + writing pass genuinely needs. Triggered by
// daily-content-trigger.mts, not called directly by users.
async function handler(req: Request) {
  const secret = req.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[daily-content-background] rejected: missing or invalid secret");
    return;
  }

  for (let i = 1; i <= CANDIDATES_PER_RUN; i++) {
    try {
      const result = await generateDailyPost();
      console.log(
        `[daily-content-background] (${i}/${CANDIDATES_PER_RUN}) generated ${result.type} draft "${result.title}" (${result.id}) — pending admin review`,
      );
    } catch (err) {
      console.error(`[daily-content-background] (${i}/${CANDIDATES_PER_RUN}) generation failed`, err);
    }
  }
}

export default handler;
