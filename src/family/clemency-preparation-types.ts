// Client-safe: imports only from @/db/schema (no db/pg connection at
// module scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants
// out of DB-touching files" note.
import { supportLetterStatusEnum } from "@/db/schema";

// Reuses supportLetterStatusEnum at the database level (see
// db-schema.ts) — same draft/generated/approved column type, different
// wording here since there's no guided-question step for a narrative the
// way there is for a support letter.
export type ClemencyNarrativeStatus = (typeof supportLetterStatusEnum.enumValues)[number];

export const CLEMENCY_NARRATIVE_STATUS_LABELS: Record<ClemencyNarrativeStatus, string> = {
  draft: "Not yet drafted",
  generated: "Draft ready for review",
  approved: "Approved",
};

/** finalContent (the family's edited version) wins once it exists; draftContent is the untouched AI output. Same pattern as support-letters-types.ts's getLetterContent. */
export function getNarrativeContent(prep: {
  narrativeDraftContent: string | null;
  narrativeFinalContent: string | null;
}): string | null {
  return prep.narrativeFinalContent ?? prep.narrativeDraftContent;
}
