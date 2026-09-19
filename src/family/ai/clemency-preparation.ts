import { z } from "zod";
import { aiService } from "@/family/ai";
import type { SupportPersonSummary } from "@/family/ai/reentry-plan";

// Guardrails restated in this tool's own words, per docs/AI.md. Spec
// section 20 adds its own explicit rule beyond the usual set: this is
// drafting assistance, not legal advice, and the tool must never be
// represented as an attorney.
const GUARDRAILS = `Hard rules:
- Never invent a fact, accomplishment, relationship, date, or circumstance that wasn't given to you.
- Never predict, promise, or imply a clemency outcome — not "this will get clemency granted," not odds, not a likelihood of success. Whether clemency is granted depends on the decision-maker, not on this tool.
- You are drafting assistance, not an attorney and not a source of legal advice. Never tell the user what the law requires, never say a document is "legally sufficient," and never answer a legal question directly — if something sounds like a legal question, that belongs on the list of questions for their actual attorney instead.
- If the information given is thin, say so plainly rather than filling the gap with something "typical" for a clemency case.`;

// --- Narrative draft ---

const narrativeSchema = z.object({
  narrative: z
    .string()
    .describe(
      "A complete draft narrative for a clemency application, written in the applicant's own voice (first person), organized roughly chronologically, weaving in the given accomplishments and support. Plain text, not Markdown.",
    ),
});

export type ChronologyEventSummary = { eventType: string; eventDate: string; description: string };
export type AccomplishmentSummary = { title: string; description: string | null; achievedDate: string | null };

function buildNarrativePrompt(params: {
  lovedOneName: string;
  chronology: ChronologyEventSummary[];
  accomplishments: AccomplishmentSummary[];
  supportPeople: SupportPersonSummary[];
}): string {
  const chronologyLines = params.chronology.length
    ? params.chronology.map((e) => `- ${e.eventDate}: ${e.eventType} — ${e.description}`).join("\n")
    : "(no timeline events recorded yet)";

  const accomplishmentLines = params.accomplishments.length
    ? params.accomplishments
        .map((a) => `- ${a.title}${a.achievedDate ? ` (${a.achievedDate})` : ""}${a.description ? `: ${a.description}` : ""}`)
        .join("\n")
    : "(no rehabilitation accomplishments recorded yet)";

  const supportLines = params.supportPeople.length
    ? params.supportPeople
        .map((p) => `- ${p.name}: can help with ${p.canHelpWith.length ? p.canHelpWith.join(", ") : "(not specified)"}`)
        .join("\n")
    : "(no support network entries yet)";

  return [
    `Draft a clemency application narrative for ${params.lovedOneName}, written in their own first-person voice.`,
    "",
    "Chronology (use ONLY these events, in this order):",
    chronologyLines,
    "",
    "Rehabilitation accomplishments (use ONLY these):",
    accomplishmentLines,
    "",
    "Support network on file (use ONLY these facts if you reference anyone by name):",
    supportLines,
  ].join("\n");
}

export async function generateClemencyNarrativeDraft(params: {
  lovedOneName: string;
  chronology: ChronologyEventSummary[];
  accomplishments: AccomplishmentSummary[];
  supportPeople: SupportPersonSummary[];
}): Promise<string> {
  const result = await aiService.draft({
    system: `You help families using Xonorate Family draft a clemency application narrative.\n\n${GUARDRAILS}`,
    prompt: buildNarrativePrompt(params),
    schema: narrativeSchema,
    effort: "medium",
    maxTokens: 2000,
  });
  return result.narrative;
}

// --- Missing documentation insight ---

// Static reference material, not user data — the AI reasons about which
// of these typical categories the family's own document titles/tags
// plausibly cover, never asserting what's actually IN a document it
// hasn't read the contents of.
const TYPICAL_CLEMENCY_DOCUMENT_TYPES = [
  "Court records (judgment and sentence)",
  "Certificates of program completion (education, vocational, treatment)",
  "Employment history or verification",
  "Character reference letters",
  "Evidence of community involvement",
  "Institutional conduct record",
  "Medical or mental health records, if relevant",
  "Proof of restitution, if applicable",
];

const missingDocsSchema = z.object({
  summary: z
    .string()
    .describe("One to three sentences naming which typical document types appear to be on file and which are likely still missing, based only on the titles/tags given."),
  likelyMissing: z
    .array(z.string())
    .describe("A short list of document types from the reference checklist that don't appear to be covered by what's on file yet."),
});

export async function generateMissingDocumentationInsight(params: {
  lovedOneName: string;
  existingDocumentTitles: string[];
}): Promise<{ summary: string; likelyMissing: string[] }> {
  const prompt = [
    `Clemency application documents on file for ${params.lovedOneName} (titles only):`,
    params.existingDocumentTitles.length ? params.existingDocumentTitles.map((t) => `- ${t}`).join("\n") : "(none on file yet)",
    "",
    "Typical document types a clemency application often includes (a reference checklist, not a requirement — every case is different):",
    TYPICAL_CLEMENCY_DOCUMENT_TYPES.map((t) => `- ${t}`).join("\n"),
  ].join("\n");

  return aiService.draft({
    system: `You help families using Xonorate Family spot gaps in the documentation they've gathered for a clemency application, against a general reference checklist. You have not read the contents of any document, only its title.\n\n${GUARDRAILS}`,
    prompt,
    schema: missingDocsSchema,
    effort: "low",
    maxTokens: 500,
  });
}

// --- Attorney questions ---

const attorneyQuestionsSchema = z.object({
  questions: z
    .string()
    .describe(
      "A clear, numbered list of specific questions to bring to an attorney meeting, based on the narrative and documentation gaps given. Plain text, not Markdown.",
    ),
});

export async function generateAttorneyQuestions(params: {
  lovedOneName: string;
  narrativeContent: string | null;
  likelyMissingDocuments: string[];
}): Promise<string> {
  const prompt = [
    `Preparing for an attorney meeting about ${params.lovedOneName}'s clemency application.`,
    "",
    "Current narrative draft (may be empty):",
    params.narrativeContent || "(no narrative drafted yet)",
    "",
    "Documentation that appears to still be missing:",
    params.likelyMissingDocuments.length ? params.likelyMissingDocuments.map((d) => `- ${d}`).join("\n") : "(none identified yet)",
  ].join("\n");

  const result = await aiService.draft({
    system: `You help families using Xonorate Family prepare specific questions to ask their own attorney about a clemency application — you generate the questions, never the legal answers.\n\n${GUARDRAILS}`,
    prompt,
    schema: attorneyQuestionsSchema,
    effort: "low",
    maxTokens: 700,
  });
  return result.questions;
}
