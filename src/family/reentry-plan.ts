import { db } from "@/db";
import { reentryPlanCategories, reentryPlans, lovedOnes } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  REENTRY_PLAN_CATEGORIES,
  type ReentryPlanCategory,
  type ReentryPlanCategoryRow,
  type ReentryPlanCategoryStatus,
} from "@/family/reentry-plan-types";

// Re-exported for server-side callers (board/list pages) that already need
// the DB functions from this file — client components must import these
// from @/family/reentry-plan-types directly instead, never from here.
export {
  REENTRY_PLAN_CATEGORIES,
  REENTRY_PLAN_CATEGORY_LABELS,
  REENTRY_PLAN_CATEGORY_STATUS_LABELS,
  REENTRY_PLAN_TIMEFRAMES,
  summarizeReentryPlanGaps,
  type ReentryPlanCategory,
  type ReentryPlanCategoryRow,
  type ReentryPlanCategoryStatus,
  type ReentryPlanTimeframe,
} from "@/family/reentry-plan-types";

/**
 * Family-wide read AND write — unlike Support Letters (author-scoped),
 * a reentry plan is shared planning work the whole family collaborates
 * on, the same access pattern as calendar/documents/loved-ones. Any
 * active family member (requireFamilyMember, not requireFamilyOwner) may
 * read or edit it.
 *
 * Creates the plan plus one row per REENTRY_PLAN_CATEGORIES entry, all at
 * "not_started" — a plan is never partially initialized, so gap detection
 * (summarizeReentryPlanGaps) never has to handle a missing category row.
 * Idempotent under the loved-one-scoped unique index: a concurrent
 * first-visit racing this insert falls back to reading the existing plan
 * rather than erroring.
 */
export async function ensureReentryPlanForLovedOne(familyId: string, lovedOneId: string) {
  const existing = await getReentryPlanForFamily(familyId, lovedOneId);
  if (existing) return existing;

  const [lovedOne] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  if (!lovedOne) return null;

  try {
    const [plan] = await db
      .insert(reentryPlans)
      .values({ familyId, lovedOneId })
      .returning();
    await db.insert(reentryPlanCategories).values(
      REENTRY_PLAN_CATEGORIES.map((category) => ({ planId: plan.id, category })),
    );
  } catch {
    // Unique-index collision from a concurrent first-visit — the plan now
    // exists either way, so just read what's there.
  }

  return getReentryPlanForFamily(familyId, lovedOneId);
}

/** Same cross-family guard as loved-ones.ts/calendar.ts: scopes on both lovedOneId and familyId, never trusting a client-supplied lovedOneId alone. */
export async function getReentryPlanForFamily(familyId: string, lovedOneId: string) {
  const [plan] = await db
    .select({ id: reentryPlans.id, lovedOneId: reentryPlans.lovedOneId })
    .from(reentryPlans)
    .where(and(eq(reentryPlans.lovedOneId, lovedOneId), eq(reentryPlans.familyId, familyId)))
    .limit(1);
  if (!plan) return null;

  const categories = await db
    .select({
      category: reentryPlanCategories.category,
      status: reentryPlanCategories.status,
      plan30Day: reentryPlanCategories.plan30Day,
      plan60Day: reentryPlanCategories.plan60Day,
      plan90Day: reentryPlanCategories.plan90Day,
    })
    .from(reentryPlanCategories)
    .where(eq(reentryPlanCategories.planId, plan.id))
    .orderBy(asc(reentryPlanCategories.category));

  return { id: plan.id, lovedOneId: plan.lovedOneId, categories: categories as ReentryPlanCategoryRow[] };
}

export type ReentryPlanCategoryInput = {
  status?: ReentryPlanCategoryStatus;
  plan30Day?: string | null;
  plan60Day?: string | null;
  plan90Day?: string | null;
};

/** Scoped through the plan's own familyId/lovedOneId so a category update can never touch a different family's row, even with a guessed planId. */
export async function updateReentryPlanCategory(
  familyId: string,
  lovedOneId: string,
  category: ReentryPlanCategory,
  input: ReentryPlanCategoryInput,
) {
  const [plan] = await db
    .select({ id: reentryPlans.id })
    .from(reentryPlans)
    .where(and(eq(reentryPlans.lovedOneId, lovedOneId), eq(reentryPlans.familyId, familyId)))
    .limit(1);
  if (!plan) return null;

  const [row] = await db
    .update(reentryPlanCategories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(reentryPlanCategories.planId, plan.id), eq(reentryPlanCategories.category, category)))
    .returning({ category: reentryPlanCategories.category });
  return row ?? null;
}
