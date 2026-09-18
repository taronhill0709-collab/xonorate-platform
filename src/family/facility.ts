import { db } from "@/db";
import { facilities } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";

/**
 * Facilities are a shared lookup, not owned by any one family (see
 * db-schema.ts) — reused across families so the same facility's info is
 * entered once. Phase 1 has no dedicated facility-management UI yet, so a
 * loved one's profile form just names a facility, and this resolves it to
 * an existing row (case-insensitive name+state match) or creates a minimal,
 * unverified one on the fly. A real facility-admin surface can backfill
 * `verified`/visitation details later without touching this function.
 */
export async function resolveFacility(
  name: string,
  state: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(and(ilike(facilities.name, name), eq(facilities.state, state)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(facilities)
    .values({ name, state, verified: false })
    .returning({ id: facilities.id });
  return created.id;
}
