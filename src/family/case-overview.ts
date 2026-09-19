import { db } from "@/db";
import { familyCases, lovedOnes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { FamilyCaseStage } from "@/family/case-overview-types";

// Re-exported for server-side callers that already import this file for
// the DB functions — client components must import these from
// @/family/case-overview-types directly instead.
export {
  FAMILY_CASE_STAGES,
  FAMILY_CASE_STAGE_LABELS,
  computeCaseCompleteness,
  hasAnyMissingInfo,
  type FamilyCaseStage,
} from "@/family/case-overview-types";

export type FamilyCaseInput = {
  caseLabel?: string | null;
  caseNumber?: string | null;
  jurisdiction?: string | null;
  court?: string | null;
  state?: string | null;
  stage?: FamilyCaseStage;
  charges?: string | null;
};

/** Family-wide read AND write, same as every Phase 2 hub table — a case snapshot is shared, collaborative work. */
export async function ensureFamilyCaseForLovedOne(familyId: string, lovedOneId: string) {
  const existing = await getFamilyCaseForFamily(familyId, lovedOneId);
  if (existing) return existing;

  const [lovedOne] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  if (!lovedOne) return null;

  try {
    await db.insert(familyCases).values({ familyId, lovedOneId });
  } catch {
    // Unique-index collision from a concurrent first-visit — read what's there.
  }

  return getFamilyCaseForFamily(familyId, lovedOneId);
}

/** Same cross-family guard as every other hub table: scopes on both lovedOneId and familyId. */
export async function getFamilyCaseForFamily(familyId: string, lovedOneId: string) {
  const [row] = await db
    .select()
    .from(familyCases)
    .where(and(eq(familyCases.lovedOneId, lovedOneId), eq(familyCases.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function updateFamilyCase(familyId: string, lovedOneId: string, input: FamilyCaseInput) {
  const [row] = await db
    .update(familyCases)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(familyCases.lovedOneId, lovedOneId), eq(familyCases.familyId, familyId)))
    .returning({ id: familyCases.id });
  return row ?? null;
}
