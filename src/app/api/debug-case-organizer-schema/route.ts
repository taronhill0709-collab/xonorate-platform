import { db } from "@/db";
import { familyCases, familyCasePeople, familyCaseIssues } from "@/db/schema";

// THROWAWAY read-only diagnostic: confirm Case Organizer's three tables
// exist on production. Delete this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const result: Record<string, string> = {};

  try {
    const rows = await db.select({ id: familyCases.id }).from(familyCases).limit(1);
    result.family_cases = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.family_cases = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db.select({ id: familyCasePeople.id }).from(familyCasePeople).limit(1);
    result.family_case_people = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.family_case_people = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db.select({ id: familyCaseIssues.id }).from(familyCaseIssues).limit(1);
    result.family_case_issues = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.family_case_issues = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return Response.json(result);
}
