// Client-safe: imports only from @/db/schema (no db/pg connection at
// module scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants
// out of DB-touching files" note.
import { familyCaseStageEnum } from "@/db/schema";

export type FamilyCaseStage = (typeof familyCaseStageEnum.enumValues)[number];

// Display order — spec section 2's list, kept in this order everywhere a
// stage list is rendered rather than relying on enum declaration order.
export const FAMILY_CASE_STAGES: FamilyCaseStage[] = [
  "arrest",
  "pretrial",
  "trial",
  "sentenced",
  "direct_appeal",
  "post_conviction",
  "federal_review",
  "clemency",
  "parole",
  "reentry",
  "other",
  "unknown",
];

export const FAMILY_CASE_STAGE_LABELS: Record<FamilyCaseStage, string> = {
  arrest: "Arrest",
  pretrial: "Pretrial",
  trial: "Trial",
  sentenced: "Sentenced",
  direct_appeal: "Direct appeal",
  post_conviction: "Post-conviction",
  federal_review: "Federal review",
  clemency: "Clemency",
  parole: "Parole",
  reentry: "Reentry",
  other: "Other",
  unknown: "Unknown",
};

export type CompletenessItem = { label: string; present: boolean };
export type CompletenessGroup = { title: string; items: CompletenessItem[] };

/**
 * Deterministic, not AI — spec section 8 is explicit that this is NOT a
 * score ("Your case is 72% complete" is exactly what it says not to
 * show). A plain presence check across the real structured data a family
 * has already entered, grouped for the Overview's "what's missing"
 * section. Pure — unit-testable without a database, same pattern as
 * dashboard.ts/reentry-plan-types.ts.
 */
export function computeCaseCompleteness(input: {
  caseNumber: string | null;
  court: string | null;
  jurisdiction: string | null;
  stage: FamilyCaseStage;
  sentenceLength: string | null;
  hasFacility: boolean;
  hasAttorney: boolean;
  documentCount: number;
  timelineEventCount: number;
  casePeopleCount: number;
}): CompletenessGroup[] {
  return [
    {
      title: "Case Information",
      items: [
        { label: "Case number", present: Boolean(input.caseNumber) },
        { label: "Court", present: Boolean(input.court) },
        { label: "Jurisdiction", present: Boolean(input.jurisdiction) },
        { label: "Current stage", present: input.stage !== "unknown" },
        { label: "Attorney contact", present: input.hasAttorney },
        { label: "Sentence", present: Boolean(input.sentenceLength) },
        { label: "Facility", present: input.hasFacility },
      ],
    },
    {
      title: "Documents",
      items: [{ label: "At least one document uploaded", present: input.documentCount > 0 }],
    },
    {
      title: "People",
      items: [{ label: "At least one person added", present: input.casePeopleCount > 0 }],
    },
    {
      title: "Timeline",
      items: [{ label: "Timeline started", present: input.timelineEventCount > 0 }],
    },
  ];
}

export function hasAnyMissingInfo(groups: CompletenessGroup[]): boolean {
  return groups.some((g) => g.items.some((i) => !i.present));
}
