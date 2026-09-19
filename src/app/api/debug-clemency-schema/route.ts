import { db } from "@/db";
import { clemencyPreparations, clemencyAccomplishments, timelineEvents, supportLetters } from "@/db/schema";
import { eq } from "drizzle-orm";

// THROWAWAY read-only diagnostic: confirm Clemency Preparation's tables
// and the Timeline table exist on production, and that the new
// "clemency" support-letter-purpose enum value is actually usable.
// Delete this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const result: Record<string, string> = {};

  try {
    const rows = await db.select({ id: clemencyPreparations.id }).from(clemencyPreparations).limit(1);
    result.clemency_preparations = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.clemency_preparations = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db.select({ id: clemencyAccomplishments.id }).from(clemencyAccomplishments).limit(1);
    result.clemency_accomplishments = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.clemency_accomplishments = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db.select({ id: timelineEvents.id }).from(timelineEvents).limit(1);
    result.timeline_events = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.timeline_events = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db
      .select({ id: supportLetters.id })
      .from(supportLetters)
      .where(eq(supportLetters.purpose, "clemency"))
      .limit(1);
    result.support_letters_clemency_purpose = `ok (enum value usable, ${rows.length} row(s) sampled)`;
  } catch (err) {
    result.support_letters_clemency_purpose = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return Response.json(result);
}
