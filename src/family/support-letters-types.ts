// Client-safe: imports only from @/db/schema (no db/pg connection at module
// scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants out of
// DB-touching files" note. A "use client" letter form imports this, never
// support-letters.ts directly.
import { supportLetterPurposeEnum, supportLetterStatusEnum } from "@/db/schema";

export type SupportLetterPurpose = (typeof supportLetterPurposeEnum.enumValues)[number];
export type SupportLetterStatus = (typeof supportLetterStatusEnum.enumValues)[number];

export const SUPPORT_LETTER_PURPOSE_LABELS: Record<SupportLetterPurpose, string> = {
  family: "Family support letter",
  character: "Character letter",
  parole: "Parole support letter",
  employer: "Employer support letter",
  community: "Community support letter",
  faith_leader: "Faith/community leader letter",
  clemency: "Clemency support letter",
};

export const SUPPORT_LETTER_STATUS_LABELS: Record<SupportLetterStatus, string> = {
  draft: "Answering questions",
  generated: "Draft ready for review",
  approved: "Approved",
};

export type SupportLetterQuestion = { key: string; label: string; placeholder?: string };

/**
 * Guided questions per purpose — the ONLY factual material the AI draft is
 * allowed to use (see src/family/ai/support-letter.ts and docs/AI.md).
 * Deliberately different per purpose rather than one generic set: what a
 * parole board needs to hear is not what an employer needs to hear.
 * `{{lovedOne}}` is replaced with the loved one's preferred/first name
 * when questions are rendered — see resolveQuestionLabel below.
 */
export const SUPPORT_LETTER_QUESTIONS: Record<SupportLetterPurpose, SupportLetterQuestion[]> = {
  family: [
    { key: "relationship", label: "How are you related to {{lovedOne}}, and how long have you known them?" },
    { key: "qualities", label: "What are {{lovedOne}}'s positive qualities? Share a specific example or story if you can." },
    { key: "changes", label: "What changes or growth have you observed in them, if any?" },
    { key: "support", label: "How do you plan to support them going forward?" },
    { key: "additional", label: "Anything else you'd like the reader to know?" },
  ],
  character: [
    { key: "relationship", label: "How do you know {{lovedOne}}, and in what context (friend, coworker, neighbor, etc.)?" },
    { key: "duration", label: "How long have you known them?" },
    { key: "character", label: "Describe their character — what specific qualities or actions stand out to you?" },
    { key: "example", label: "Can you share a specific story or example that illustrates this?" },
    { key: "additional", label: "Anything else you'd like to add?" },
  ],
  parole: [
    { key: "relationship", label: "How are you connected to {{lovedOne}} (family, friend, employer, etc.)?" },
    { key: "changes", label: "What changes or growth have you observed since their incarceration began?" },
    { key: "supportAvailable", label: "What support will be available to them if released (housing, employment, family, community)?" },
    { key: "readiness", label: "Why do you believe they are ready to return to the community?" },
    { key: "additional", label: "Anything else the parole board should know?" },
  ],
  employer: [
    { key: "relationship", label: "What is your relationship to {{lovedOne}} (would-be employer, past employer, etc.)?" },
    { key: "role", label: "What job or role would you offer, or did they hold?" },
    { key: "qualities", label: "What skills or qualities make them a good fit?" },
    { key: "support", label: "What support will you provide as their employer?" },
    { key: "additional", label: "Anything else you'd like to add?" },
  ],
  community: [
    { key: "organization", label: "What organization or community do you represent?" },
    { key: "relationship", label: "How do you know {{lovedOne}} or their family?" },
    { key: "resources", label: "What support or resources can your organization/community offer?" },
    { key: "why", label: "Why does your community support their reentry?" },
    { key: "additional", label: "Anything else you'd like to add?" },
  ],
  faith_leader: [
    { key: "role", label: "What is your role (pastor, faith leader, etc.), and how do you know {{lovedOne}}?" },
    { key: "observations", label: "What have you observed about their character or faith journey?" },
    { key: "support", label: "What support will your congregation/community provide?" },
    { key: "additional", label: "Anything else you'd like to add?" },
  ],
  clemency: [
    { key: "relationship", label: "How are you connected to {{lovedOne}} (family, friend, employer, etc.)?" },
    { key: "changes", label: "What changes or growth have you observed since their incarceration began?" },
    { key: "impact", label: "How has their incarceration affected you, your family, or your community?" },
    { key: "supportAvailable", label: "What support will be available to them if clemency is granted?" },
    { key: "additional", label: "Anything else the decision-maker should know?" },
  ],
};

export function resolveQuestionLabel(label: string, lovedOneName: string): string {
  return label.replaceAll("{{lovedOne}}", lovedOneName);
}

/** finalContent (the author's edited version) wins once it exists; draftContent is the untouched AI output. Kept here (not support-letters.ts, which imports the db connection) so it's unit-testable without a database — see dashboard.ts for the same pattern. */
export function getLetterContent(letter: { draftContent: string | null; finalContent: string | null }): string | null {
  return letter.finalContent ?? letter.draftContent;
}
