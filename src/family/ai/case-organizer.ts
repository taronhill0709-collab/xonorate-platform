import { z } from "zod";
import { aiService } from "@/family/ai";

// Guardrails restated in this tool's own words, per docs/AI.md. Case
// Organizer's spec (sections 10 and 27) is the most explicit of any
// Family tool about what this must never do — restated verbatim in
// spirit, not paraphrased into something weaker.
const GUARDRAILS = `Hard rules:
- Never invent a case fact, date, court ruling, legal authority, piece of evidence, or testimony that wasn't given to you.
- Never claim someone is innocent. Never claim someone is guilty. Never determine or imply whether someone was wrongfully convicted. This tool does not make legal determinations of any kind.
- Never create or imply a score, percentage, or rating of any kind about the case or its strength — no "innocence score," no completeness percentage, nothing that reduces the case to a number.
- Never guarantee parole, clemency, or any other legal outcome. Never predict a legal outcome.
- Never present legal advice as fact, and never pretend to be an attorney.
- Distinguish, in your own summary, between what the family entered directly and what you are inferring or organizing — don't blur "the family said X" into "X is true."
- If you notice two pieces of information that don't match, present it as something to review, not as proof of misconduct or of innocence. Use language like "this appears different from..." or "this may warrant verification" — never "there is an inconsistency" stated as fact.
- When information is unavailable, say so plainly: "I don't have enough information in what you've provided to answer that." When something sounds like a legal question, say it may be something to discuss with an attorney, rather than answering it yourself.`;

const summarySchema = z.object({
  summary: z
    .string()
    .describe(
      "A plain-language summary answering, as far as the given information allows: what is this case, where does it stand, and what needs attention. Several short paragraphs, not a legal brief. Plain text, not Markdown.",
    ),
});

export type CaseChronologyEventSummary = { eventType: string; eventDate: string | null; description: string };
export type CasePersonSummary = { name: string; personType: string };

function buildSummaryPrompt(params: {
  lovedOneName: string;
  chronology: CaseChronologyEventSummary[];
  documentTitles: string[];
  people: CasePersonSummary[];
  openIssueTitles: string[];
  upcomingDateCount: number;
}): string {
  const chronologyLines = params.chronology.length
    ? params.chronology.map((e) => `- ${e.eventDate ?? "(date unknown)"}: ${e.eventType} — ${e.description}`).join("\n")
    : "(no timeline events recorded yet)";

  return [
    `Case workspace summary for ${params.lovedOneName}. Everything below was entered directly by the family — treat it as user-provided information, not verified fact.`,
    "",
    "Timeline (chronological):",
    chronologyLines,
    "",
    "Documents on file (titles only — you have not read their contents):",
    params.documentTitles.length ? params.documentTitles.map((t) => `- ${t}`).join("\n") : "(none yet)",
    "",
    "People connected to the case:",
    params.people.length ? params.people.map((p) => `- ${p.name} (${p.personType})`).join("\n") : "(none added yet)",
    "",
    "Open issues/questions the family has flagged:",
    params.openIssueTitles.length ? params.openIssueTitles.map((t) => `- ${t}`).join("\n") : "(none open)",
    "",
    `Upcoming dates on the calendar: ${params.upcomingDateCount}`,
  ].join("\n");
}

export async function generateCaseSummary(params: {
  lovedOneName: string;
  chronology: CaseChronologyEventSummary[];
  documentTitles: string[];
  people: CasePersonSummary[];
  openIssueTitles: string[];
  upcomingDateCount: number;
}): Promise<string> {
  const result = await aiService.draft({
    system: `You help families using Xonorate Family understand where a case currently stands, organized from the structured information they've entered.\n\n${GUARDRAILS}`,
    prompt: buildSummaryPrompt(params),
    schema: summarySchema,
    effort: "medium",
    maxTokens: 1500,
  });
  return result.summary;
}

// --- Prepared, not yet activated (spec sections 11/12) ---
// No document-text-extraction or OCR pipeline exists yet — spec section 4
// explicitly says not to build one this milestone, only to prepare the
// architecture for it. These two functions are real, working
// implementations of that architecture (same aiService.draft() pattern,
// same guardrails), but nothing in the UI calls them yet: there is no
// document text to feed generateDocumentUnderstanding, and no extraction
// job to produce candidates for extractTimelineEventCandidates. Wire
// them in once Case Organizer (or a later milestone) actually extracts
// text from an uploaded file.

const documentUnderstandingSchema = z.object({
  whatThisIs: z.string().describe("A plain-language description of what kind of document this is."),
  importantInformation: z.string().describe("Key facts directly supported by the document's text."),
  importantDates: z.string().describe("Dates found in the document's text, plain text list."),
  peopleMentioned: z.string().describe("Names and roles mentioned in the document's text, where identifiable."),
  questionsToConsider: z.string().describe("Questions the family may want to clarify, based only on this document."),
});

export async function generateDocumentUnderstanding(params: {
  lovedOneName: string;
  documentTitle: string;
  documentText: string;
}): Promise<z.infer<typeof documentUnderstandingSchema>> {
  return aiService.draft({
    system: `You help families using Xonorate Family understand a single document from ${params.lovedOneName}'s case. You are given the document's own text — use ONLY what it actually says.\n\n${GUARDRAILS}`,
    prompt: `Document title: ${params.documentTitle}\n\nDocument text:\n${params.documentText}`,
    schema: documentUnderstandingSchema,
    effort: "medium",
    maxTokens: 1500,
  });
}

const timelineExtractionSchema = z.object({
  candidates: z
    .array(
      z.object({
        eventType: z.string().describe("A short type label, e.g. 'Sentencing' or 'Appeal Filed'."),
        eventDate: z.string().nullable().describe("The date in YYYY-MM-DD form, or null if not stated clearly."),
        description: z.string().describe("A one-sentence description of what happened, using only the document's own words/facts."),
      }),
    )
    .describe("Candidate timeline events found in the document. Never invent one the text doesn't support."),
});

/**
 * Returns candidates only — the caller MUST create any resulting
 * timelineEvents rows with origin: "ai_extracted", never "user", and the
 * family must explicitly confirm each one before it's treated as part of
 * the real timeline (spec section 3/12's "needs confirmation" rule).
 * This function itself writes nothing.
 */
export async function extractTimelineEventCandidates(params: {
  lovedOneName: string;
  documentTitle: string;
  documentText: string;
}): Promise<z.infer<typeof timelineExtractionSchema>["candidates"]> {
  const result = await aiService.draft({
    system: `You identify potential timeline events from a single case document for ${params.lovedOneName}. You are given the document's own text — use ONLY what it actually says. Every candidate you return will be shown to the family as "needs confirmation," never added automatically.\n\n${GUARDRAILS}`,
    prompt: `Document title: ${params.documentTitle}\n\nDocument text:\n${params.documentText}`,
    schema: timelineExtractionSchema,
    effort: "medium",
    maxTokens: 1500,
  });
  return result.candidates;
}
