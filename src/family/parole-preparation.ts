import { db } from "@/db";
import { parolePreparations, parolePreparationSections, lovedOnes } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { listSupportLettersForFamily } from "@/family/support-letters";
import { listLetterRequestsForFamily } from "@/family/support-letter-requests";
import { listFamilyDocuments } from "@/family/documents";
import { getReentryPlanForFamily } from "@/family/reentry-plan";
import {
  PAROLE_FREEFORM_SECTIONS,
  PAROLE_SECTIONS,
  computeDocumentsStatus,
  computeFirst90DaysStatus,
  computeSupportLettersStatus,
  computeSupportNetworkStatus,
  type ParoleFreeformSection,
  type ParoleSectionRow,
  type ParoleSectionStatus,
} from "@/family/parole-preparation-types";

// Re-exported for server-side callers that already import this file for
// the DB functions — client components must import these from
// @/family/parole-preparation-types directly instead.
export {
  PAROLE_SECTIONS,
  PAROLE_SECTION_STATUS_LABELS,
  summarizeParolePreparationGaps,
  type ParoleFreeformSection,
  type ParoleSectionKey,
  type ParoleSectionRow,
  type ParoleSectionStatus,
} from "@/family/parole-preparation-types";

/**
 * Family-wide read AND write, same as the Reentry Planner — shared
 * planning work, not one person's voice. Creates the preparation plus one
 * row per PAROLE_FREEFORM_SECTIONS entry, all "not_started". Idempotent
 * under the loved-one-scoped unique index, same race-handling as
 * ensureReentryPlanForLovedOne.
 */
export async function ensureParolePreparationForLovedOne(familyId: string, lovedOneId: string) {
  const existing = await getParolePreparationSections(familyId, lovedOneId);
  if (existing) return existing;

  const [lovedOne] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  if (!lovedOne) return null;

  try {
    const [prep] = await db
      .insert(parolePreparations)
      .values({ familyId, lovedOneId })
      .returning();
    await db.insert(parolePreparationSections).values(
      PAROLE_FREEFORM_SECTIONS.map((section) => ({ preparationId: prep.id, section })),
    );
  } catch {
    // Unique-index collision from a concurrent first-visit — read what's there.
  }

  return getParolePreparationSections(familyId, lovedOneId);
}

/** Same cross-family guard as reentry-plan.ts: scopes on both lovedOneId and familyId. Only the freeform rows — see getParolePreparationOverview for the full eleven-section view including derived sections. */
export async function getParolePreparationSections(familyId: string, lovedOneId: string) {
  const [prep] = await db
    .select({ id: parolePreparations.id, lovedOneId: parolePreparations.lovedOneId })
    .from(parolePreparations)
    .where(and(eq(parolePreparations.lovedOneId, lovedOneId), eq(parolePreparations.familyId, familyId)))
    .limit(1);
  if (!prep) return null;

  const sections = await db
    .select({
      section: parolePreparationSections.section,
      status: parolePreparationSections.status,
      notes: parolePreparationSections.notes,
    })
    .from(parolePreparationSections)
    .where(eq(parolePreparationSections.preparationId, prep.id))
    .orderBy(asc(parolePreparationSections.section));

  return { id: prep.id, lovedOneId: prep.lovedOneId, sections };
}

export type ParoleFreeformSectionInput = { status?: ParoleSectionStatus; notes?: string | null };

/** Scoped through the preparation's own familyId/lovedOneId, same shape as updateReentryPlanCategory. */
export async function updateParolePreparationSection(
  familyId: string,
  lovedOneId: string,
  section: ParoleFreeformSection,
  input: ParoleFreeformSectionInput,
) {
  const [prep] = await db
    .select({ id: parolePreparations.id })
    .from(parolePreparations)
    .where(and(eq(parolePreparations.lovedOneId, lovedOneId), eq(parolePreparations.familyId, familyId)))
    .limit(1);
  if (!prep) return null;

  const [row] = await db
    .update(parolePreparationSections)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(parolePreparationSections.preparationId, prep.id), eq(parolePreparationSections.section, section)))
    .returning({ section: parolePreparationSections.section });
  return row ?? null;
}

/**
 * The full eleven-section view for the board: freeform sections come
 * from this feature's own table; the four derived sections are computed
 * live by composing existing Family domain functions (never raw queries
 * against their tables) — Support Network from listSupportPeopleForFamily,
 * Support Letters from listSupportLettersForFamily +
 * listLetterRequestsForFamily filtered to purpose "parole", Documents
 * from listFamilyDocuments filtered to category "parole", and First 90
 * Days from the loved one's own Reentry Plan via getReentryPlanForFamily.
 * See docs/AI.md's context-minimalism rule — this composition, not a new
 * raw query, is also what generateParolePreparationInsight's caller
 * builds its AI prompt from.
 */
export async function getParolePreparationOverview(
  familyId: string,
  lovedOneId: string,
): Promise<{ sections: ParoleSectionRow[]; freeformNotes: Record<ParoleFreeformSection, string | null> } | null> {
  const prep = await ensureParolePreparationForLovedOne(familyId, lovedOneId);
  if (!prep) return null;

  const [supportPeople, letters, requests, documents, reentryPlan] = await Promise.all([
    listSupportPeopleForFamily(familyId),
    listSupportLettersForFamily(familyId),
    listLetterRequestsForFamily(familyId),
    listFamilyDocuments(familyId, { lovedOneId }),
    getReentryPlanForFamily(familyId, lovedOneId),
  ]);

  const relevantSupportPeople = supportPeople
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));

  const paroleLetters = [
    ...letters.filter((l) => l.lovedOneId === lovedOneId && l.purpose === "parole"),
    ...requests.filter((r) => r.lovedOneId === lovedOneId && r.purpose === "parole"),
  ];

  const paroleDocumentCount = documents.filter((d) => d.category === "parole").length;

  const reentryStatuses = reentryPlan ? reentryPlan.categories.map((c) => c.status) : null;

  const derivedStatus: Record<"support_network" | "documents" | "support_letters" | "first_90_days", ParoleSectionStatus> = {
    support_network: computeSupportNetworkStatus(relevantSupportPeople),
    documents: computeDocumentsStatus(paroleDocumentCount),
    support_letters: computeSupportLettersStatus(paroleLetters),
    first_90_days: computeFirst90DaysStatus(reentryStatuses),
  };

  const freeformMap = new Map(prep.sections.map((s) => [s.section, s]));

  const sections: ParoleSectionRow[] = PAROLE_SECTIONS.map(({ key, label, kind }) => ({
    key,
    label,
    status:
      kind === "derived"
        ? derivedStatus[key as "support_network" | "documents" | "support_letters" | "first_90_days"]
        : (freeformMap.get(key as ParoleFreeformSection)?.status ?? "not_started"),
  }));

  const freeformNotes = Object.fromEntries(
    PAROLE_FREEFORM_SECTIONS.map((section) => [section, freeformMap.get(section)?.notes ?? null]),
  ) as Record<ParoleFreeformSection, string | null>;

  return { sections, freeformNotes };
}
