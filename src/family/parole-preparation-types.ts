// Client-safe: imports only from @/db/schema (no db/pg connection at
// module scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants
// out of DB-touching files" note.
import { paroleFreeformSectionEnum } from "@/db/schema";
import {
  type ReentryPlanCategoryStatus,
  REENTRY_PLAN_CATEGORY_STATUS_LABELS,
} from "@/family/reentry-plan-types";

export type ParoleFreeformSection = (typeof paroleFreeformSectionEnum.enumValues)[number];

// Reuses the Reentry Planner's three-value status (not_started/incomplete/
// complete) — same enum column in the database, same meaning here.
export type ParoleSectionStatus = ReentryPlanCategoryStatus;
export const PAROLE_SECTION_STATUS_LABELS = REENTRY_PLAN_CATEGORY_STATUS_LABELS;

export type ParoleSectionKey = ParoleFreeformSection | "support_network" | "first_90_days" | "support_letters" | "documents";

/**
 * All eleven sections from the approved spec, in the fixed display order.
 * "derived" sections have no row of their own here — their status comes
 * from another Family feature (see parole-preparation.ts) — so the UI and
 * the AI insight both know not to offer an edit form for them.
 */
export const PAROLE_SECTIONS: { key: ParoleSectionKey; label: string; kind: "freeform" | "derived" }[] = [
  { key: "support_network", label: "Support Network", kind: "derived" },
  { key: "housing", label: "Housing", kind: "freeform" },
  { key: "employment", label: "Employment", kind: "freeform" },
  { key: "transportation", label: "Transportation", kind: "freeform" },
  { key: "education", label: "Education", kind: "freeform" },
  { key: "community_support", label: "Community Support", kind: "freeform" },
  { key: "personal_goals", label: "Personal Goals", kind: "freeform" },
  { key: "family_support", label: "Family Support", kind: "freeform" },
  { key: "first_90_days", label: "First 90 Days", kind: "derived" },
  { key: "support_letters", label: "Support Letters", kind: "derived" },
  { key: "documents", label: "Documents", kind: "derived" },
];

export const PAROLE_FREEFORM_SECTIONS: ParoleFreeformSection[] = PAROLE_SECTIONS.filter(
  (s) => s.kind === "freeform",
).map((s) => s.key as ParoleFreeformSection);

export type ParoleSectionRow = { key: ParoleSectionKey; label: string; status: ParoleSectionStatus };

/** Pure — unit-testable without a database, same pattern as dashboard.ts/reentry-plan-types.ts. */
export function summarizeParolePreparationGaps(sections: Pick<ParoleSectionRow, "key" | "status">[]): {
  complete: ParoleSectionKey[];
  incomplete: ParoleSectionKey[];
  notStarted: ParoleSectionKey[];
} {
  const complete: ParoleSectionKey[] = [];
  const incomplete: ParoleSectionKey[] = [];
  const notStarted: ParoleSectionKey[] = [];

  for (const row of sections) {
    if (row.status === "complete") complete.push(row.key);
    else if (row.status === "incomplete") incomplete.push(row.key);
    else notStarted.push(row.key);
  }

  return { complete, incomplete, notStarted };
}

/** Support Network is "derived": complete once at least one support person is on file AND at least one of them has a canHelpWith tag (a name alone doesn't tell the family — or the AI — what that person can actually help with). */
export function computeSupportNetworkStatus(supportPeople: { canHelpWith: string[] }[]): ParoleSectionStatus {
  if (supportPeople.length === 0) return "not_started";
  return supportPeople.some((p) => p.canHelpWith.length > 0) ? "complete" : "incomplete";
}

/** Documents is "derived" from familyDocuments filtered to category "parole" — a binary has-one-or-not, so it never reaches "incomplete". */
export function computeDocumentsStatus(paroleDocumentCount: number): ParoleSectionStatus {
  return paroleDocumentCount > 0 ? "complete" : "not_started";
}

/** Support Letters is "derived" from supportLetters/supportLetterRequests filtered to purpose "parole": not_started with none, incomplete once one exists but isn't approved yet, complete once at least one is approved. */
export function computeSupportLettersStatus(paroleLetters: { status: string }[]): ParoleSectionStatus {
  if (paroleLetters.length === 0) return "not_started";
  return paroleLetters.some((l) => l.status === "approved") ? "complete" : "incomplete";
}

/**
 * First 90 Days is "derived" from the loved one's own Reentry Plan — that
 * plan's 30/60/90-day content across every category IS the first-90-days
 * plan, so this never asks the family to re-enter it. `null` means the
 * loved one has no Reentry Plan yet at all (not_started); otherwise it's
 * complete only once every category is complete, incomplete once any
 * category has started.
 */
export function computeFirst90DaysStatus(
  reentryCategoryStatuses: ReentryPlanCategoryStatus[] | null,
): ParoleSectionStatus {
  if (!reentryCategoryStatuses || reentryCategoryStatuses.length === 0) return "not_started";
  if (reentryCategoryStatuses.every((s) => s === "complete")) return "complete";
  if (reentryCategoryStatuses.every((s) => s === "not_started")) return "not_started";
  return "incomplete";
}
