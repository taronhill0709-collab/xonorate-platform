import { generateDailyPost } from "../../src/lib/content-pipeline";

// Background function: 15-minute execution budget (vs 30s for regular/scheduled
// functions), which the research + writing pass genuinely needs. Triggered by
// daily-content-trigger.mts, not called directly by users.
async function handler(req: Request) {
  const secret = req.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    console.error("[daily-content-background] rejected: missing or invalid secret");
    return;
  }

  try {
    const result = await generateDailyPost();
    console.log(
      `[daily-content-background] generated roundup draft "${result.title}" (${result.id}) — pending admin review`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Idempotency errors are not failures — log them as info to avoid noise
    if (message.includes("already generated today")) {
      console.log(`[daily-content-background] ${message}`);
    } else {
      console.error("[daily-content-background] generation failed", err);
    }
  }
}

export default handler;
