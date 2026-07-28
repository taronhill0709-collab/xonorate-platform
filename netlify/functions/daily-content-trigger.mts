import type { Config } from "@netlify/functions";

// Fires the daily-content-background function — scheduled/regular functions
// have a 30s budget, background functions get 15 minutes, which the research
// + writing pass needs. We `await` the dispatch request itself: Netlify
// accepts a background-function invocation and responds 202 within
// milliseconds, without waiting for the job to finish, so this stays well
// inside the 30s budget. It must be awaited — an un-awaited `fetch` here was
// found to get cut off when this function's execution context tears down
// before the request actually leaves, silently no-op'ing the whole job.
//
// Runs daily at noon UTC (activated 2026-07-27 after a manual run was
// reviewed and approved). Drafts still land in the pending queue for admin
// review — this only automates generation, not publishing.
async function handler(req: Request) {
  let nextRun: string | undefined;
  try {
    const body = await req.json();
    nextRun = body?.next_run;
  } catch {
    // No JSON body — expected when invoked manually rather than by a schedule.
  }
  console.log("[daily-content-trigger] firing background job", nextRun ? `(next scheduled run: ${nextRun})` : "");

  const origin = process.env.URL ?? process.env.DEPLOY_PRIME_URL;
  const secret = process.env.DAILY_CONTENT_SECRET;
  if (!origin || !secret) {
    console.error("[daily-content-trigger] missing URL or DAILY_CONTENT_SECRET env var, skipping");
    return;
  }

  try {
    const res = await fetch(`${origin}/.netlify/functions/daily-content-background`, {
      method: "POST",
      headers: { "x-daily-content-secret": secret },
    });
    console.log(`[daily-content-trigger] background job dispatched, status ${res.status}`);
  } catch (err) {
    console.error("[daily-content-trigger] failed to invoke background function", err);
  }
}

export default handler;

export const config: Config = {
  schedule: "0 12 * * *",
};
