// Fires the daily-content-background function and returns immediately —
// scheduled/regular functions have a 30s budget, background functions get
// 15 minutes, which the research + writing pass needs.
//
// The `schedule` config below is intentionally commented out. Per the build
// spec: don't auto-run this on a cron until output quality has been
// verified for a few weeks. To activate, uncomment the `config` export
// with a cron expression (UTC) — e.g. "0 12 * * *" for daily at noon UTC —
// and set the DAILY_CONTENT_SECRET env var (also required right now for
// manual invocation to work). Until then, trigger a run manually:
//   curl -X POST https://<site>/.netlify/functions/daily-content-trigger
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

  fetch(`${origin}/.netlify/functions/daily-content-background`, {
    method: "POST",
    headers: { "x-daily-content-secret": secret },
  }).catch((err) => console.error("[daily-content-trigger] failed to invoke background function", err));
}

export default handler;

// import type { Config } from "@netlify/functions";
// export const config: Config = {
//   schedule: "0 12 * * *",
// };
