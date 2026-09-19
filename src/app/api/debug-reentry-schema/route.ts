import { db } from "@/db";
import { reentryPlans, reentryPlanCategories } from "@/db/schema";

// THROWAWAY read-only diagnostic: confirm the Reentry Planner's tables
// exist on production. CLI migration/status commands only report on the
// local dev database, not production (see docs/AI.md), so this is the
// only trustworthy way to check. Delete this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const result: Record<string, string> = {};

  try {
    const rows = await db.select({ id: reentryPlans.id }).from(reentryPlans).limit(1);
    result.reentry_plans = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.reentry_plans = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const rows = await db
      .select({ id: reentryPlanCategories.id })
      .from(reentryPlanCategories)
      .limit(1);
    result.reentry_plan_categories = `ok (${rows.length} row(s) sampled)`;
  } catch (err) {
    result.reentry_plan_categories = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return Response.json(result);
}
