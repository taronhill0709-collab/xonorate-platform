import { type CaseStat, parseStats, serializeStats } from "@/lib/innocence-claim";

export type ImpactFacts = {
  ageAtArrest: number | null;
  maritalStatus: string; // "", "single", "married", "divorced", "widowed"
  numberOfChildren: number | null;
  childrenAgesAtArrest: string;
  primaryCaregiver: boolean;
  occupationAtArrest: string;
  additionalFamilyFacts: string[];
  communityRole: string;
  actualPerpetratorOutcome: string;
  additionalCommunityFacts: string[];
};

export const EMPTY_IMPACT_FACTS: ImpactFacts = {
  ageAtArrest: null,
  maritalStatus: "",
  numberOfChildren: null,
  childrenAgesAtArrest: "",
  primaryCaregiver: false,
  occupationAtArrest: "",
  additionalFamilyFacts: [],
  communityRole: "",
  actualPerpetratorOutcome: "",
  additionalCommunityFacts: [],
};

export type CaseImpact = {
  facts: ImpactFacts;
  // Generated from `facts` by draftImpactNarrative — never hand-written.
  // Editable afterward only to correct a generation mistake, not to add
  // new claims the facts don't support.
  familyImpact: string;
  communityImpact: string;
  stats: CaseStat[];
};

/** One fact per line. */
export function parseFactLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeFactLines(lines: string[]): string {
  return lines.join("\n");
}

export { parseStats as parseImpactStats, serializeStats as serializeImpactStats };
