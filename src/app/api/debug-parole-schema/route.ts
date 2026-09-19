import { db } from "@/db";
import { parolePreparations, parolePreparationSections } from "@/db/schema";

// THROWAWAY read-only diagnostic: confirm Parole Preparation's tables
// exist on production. CLI migration/status commands only report on the
// local dev database, not production (see docs/AI.md). Delete this route
// once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const result: Record<string, string> = {};

  try {
    const rows = await db.select({ id: parolePreparations.id }).from(parolePreparations).limit(1);
    result.parole_preparations = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.parole_preparations = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db
      .select({ id: parolePreparationSections.id })
      .from(parolePreparationSections)
      .limit(1);
    result.parole_preparation_sections = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.parole_preparation_sections = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return Response.json(result);
}
