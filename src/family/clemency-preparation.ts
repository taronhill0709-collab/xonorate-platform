import { db } from "@/db";
import { clemencyPreparations, clemencyAccomplishments, lovedOnes } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  generateClemencyNarrativeDraft,
  generateAttorneyQuestions,
  type AccomplishmentSummary,
  type ChronologyEventSummary,
} from "@/family/ai/clemency-preparation";
import type { SupportPersonSummary } from "@/family/ai/reentry-plan";

// Re-exported for server-side callers that already import this file for
// the DB functions — client components must import these from
// @/family/clemency-preparation-types directly instead.
export {
  CLEMENCY_NARRATIVE_STATUS_LABELS,
  getNarrativeContent,
  type ClemencyNarrativeStatus,
} from "@/family/clemency-preparation-types";

// --- Narrative + attorney questions hub (one row per loved one) ---

/** Family-wide read AND write, same as Reentry Planner/Parole Preparation — a clemency narrative is shared, collaborative work, not one person's voice. */
export async function ensureClemencyPreparationForLovedOne(familyId: string, lovedOneId: string) {
  const existing = await getClemencyPreparationForFamily(familyId, lovedOneId);
  if (existing) return existing;

  const [lovedOne] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  if (!lovedOne) return null;

  try {
    await db.insert(clemencyPreparations).values({ familyId, lovedOneId });
  } catch {
    // Unique-index collision from a concurrent first-visit — read what's there.
  }

  return getClemencyPreparationForFamily(familyId, lovedOneId);
}

/** Same cross-family guard as reentry-plan.ts/parole-preparation.ts. */
export async function getClemencyPreparationForFamily(familyId: string, lovedOneId: string) {
  const [row] = await db
    .select()
    .from(clemencyPreparations)
    .where(and(eq(clemencyPreparations.lovedOneId, lovedOneId), eq(clemencyPreparations.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function updateClemencyNarrativeContent(
  familyId: string,
  lovedOneId: string,
  finalContent: string,
) {
  const [row] = await db
    .update(clemencyPreparations)
    .set({ narrativeFinalContent: finalContent, updatedAt: new Date() })
    .where(and(eq(clemencyPreparations.lovedOneId, lovedOneId), eq(clemencyPreparations.familyId, familyId)))
    .returning({ id: clemencyPreparations.id });
  return row ?? null;
}

export async function approveClemencyNarrative(familyId: string, lovedOneId: string) {
  const [row] = await db
    .update(clemencyPreparations)
    .set({ narrativeStatus: "approved", updatedAt: new Date() })
    .where(and(eq(clemencyPreparations.lovedOneId, lovedOneId), eq(clemencyPreparations.familyId, familyId)))
    .returning({ id: clemencyPreparations.id });
  return row ?? null;
}

/** The one place this tool drafts the narrative — see docs/AI.md for the context rule this follows (only the loved one's own chronology/accomplishments/support network, nothing else from the family's data). */
export async function regenerateClemencyNarrativeDraft(params: {
  familyId: string;
  lovedOneId: string;
  lovedOneName: string;
  chronology: ChronologyEventSummary[];
  accomplishments: AccomplishmentSummary[];
  supportPeople: SupportPersonSummary[];
}) {
  const narrative = await generateClemencyNarrativeDraft({
    lovedOneName: params.lovedOneName,
    chronology: params.chronology,
    accomplishments: params.accomplishments,
    supportPeople: params.supportPeople,
  });

  const [row] = await db
    .update(clemencyPreparations)
    .set({
      narrativeDraftContent: narrative,
      // Same reasoning as regenerateSupportLetterDraft/
      // regenerateReentryPlanCategoryDraft: a fresh regeneration must
      // actually be what the family sees next.
      narrativeFinalContent: null,
      narrativeStatus: "generated",
      updatedAt: new Date(),
    })
    .where(and(eq(clemencyPreparations.lovedOneId, params.lovedOneId), eq(clemencyPreparations.familyId, params.familyId)))
    .returning();
  return row ?? null;
}

export async function regenerateClemencyAttorneyQuestions(params: {
  familyId: string;
  lovedOneId: string;
  lovedOneName: string;
  narrativeContent: string | null;
  likelyMissingDocuments: string[];
}) {
  const questions = await generateAttorneyQuestions({
    lovedOneName: params.lovedOneName,
    narrativeContent: params.narrativeContent,
    likelyMissingDocuments: params.likelyMissingDocuments,
  });

  const [row] = await db
    .update(clemencyPreparations)
    .set({ attorneyQuestionsContent: questions, updatedAt: new Date() })
    .where(and(eq(clemencyPreparations.lovedOneId, params.lovedOneId), eq(clemencyPreparations.familyId, params.familyId)))
    .returning({ attorneyQuestionsContent: clemencyPreparations.attorneyQuestionsContent });
  return row ?? null;
}

// --- Rehabilitation accomplishments (variable-length list) ---

export type AccomplishmentInput = {
  title: string;
  description?: string | null;
  achievedDate?: string | null;
};

export async function createClemencyAccomplishment(
  familyId: string,
  lovedOneId: string,
  input: AccomplishmentInput,
) {
  const [row] = await db
    .insert(clemencyAccomplishments)
    .values({ familyId, lovedOneId, ...input })
    .returning();
  return row;
}

export async function listClemencyAccomplishments(familyId: string, lovedOneId: string) {
  return db
    .select()
    .from(clemencyAccomplishments)
    .where(and(eq(clemencyAccomplishments.familyId, familyId), eq(clemencyAccomplishments.lovedOneId, lovedOneId)))
    .orderBy(asc(clemencyAccomplishments.achievedDate));
}

/** Same cross-family guard as everywhere else: scopes on both accomplishmentId and familyId. */
export async function deleteClemencyAccomplishment(familyId: string, accomplishmentId: string) {
  const [row] = await db
    .delete(clemencyAccomplishments)
    .where(and(eq(clemencyAccomplishments.id, accomplishmentId), eq(clemencyAccomplishments.familyId, familyId)))
    .returning({ id: clemencyAccomplishments.id });
  return row ?? null;
}
