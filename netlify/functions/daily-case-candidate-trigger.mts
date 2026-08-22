import type { Config } from "@netlify/functions";

// Fires the daily-case-candidate-background function — mirrors
// daily-content-trigger.mts exactly, including the "must be awaited" note
// on the dispatch fetch below (an un-awaited fetch here was found to get cut
// off before it left when this function's execution context tears down).
//
// Runs daily at 1pm UTC — offset an hour from the roundup trigger (noon UTC)
// so the two research jobs don't compete for the same window. Candidates
// still land in a review-only staging area for admin approval — this only
// automates research, never writes to the `cases` table directly.
async function handler(req: Request) {
  let nextRun: string | undefined;
  try {
    const body = await req.json();
    nextRun = body?.next_run;
  } catch {
    // No JSON body — expected when invoked manually rather than by a schedule.
  }
  console.log(
    "[daily-case-candidate-trigger] firing background job",
    nextRun ? `(next scheduled run: ${nextRun})` : "",
  );

  const origin = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.DAILY_CONTENT_SECRET;
  if (!origin || !secret) {
    console.error("[daily-case-candidate-trigger] missing URL or DAILY_CONTENT_SECRET env var, skipping");
    return;
  }

  try {
    const res = await fetch(`${origin}/.netlify/functions/daily-case-candidate-background`, {
      method: "POST",
      headers: { "x-daily-content-secret": secret },
    });
    console.log(`[daily-case-candidate-trigger] background job dispatched, status ${res.status}`);
  } catch (err) {
    console.error("[daily-case-candidate-trigger] failed to invoke background function", err);
  }
}

export default handler;

export const config: Config = {
  schedule: "0 13 * * *",
};
