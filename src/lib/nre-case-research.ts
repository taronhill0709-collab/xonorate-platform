import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  EVIDENCE_CATEGORY_FIELDS,
  serializeCategoryItems,
  serializeStats,
  type EvidenceItem,
} from "@/lib/innocence-claim";
import type { CaseOverviewDraft } from "@/lib/case-overview-extraction";

export type CaseCandidateDraft = CaseOverviewDraft & { sourceUrl: string };
export type RosterEntry = { clientName: string; state: string; sourceUrl: string | null };

// Step 1: research via web_search. Kept deliberately simple — combining the
// web_search tool with a large structured schema (the full candidate shape
// below) hits Anthropic's "Schema is too complex" limit (confirmed via a
// live 400 while testing this pipeline). content-pipeline.ts's roundup
// avoids this the same way, by keeping its own web_search output schema to
// a handful of flat fields.
const researchSchema = z.object({
  found: z
    .boolean()
    .describe("True if you identified one suitable, undocumented candidate. False if none exists this run."),
  clientName: z.string().optional(),
  sourceUrl: z
    .string()
    .optional()
    .describe("The exact National Registry of Exonerations case-profile URL for this case."),
  brief: z
    .string()
    .optional()
    .describe(
      "A thorough plain-text research brief covering every fact listed in the system prompt, grounded strictly in what you found.",
    ),
});

const RESEARCH_SYSTEM = `You research one exonerated person's case for Xonorate Media Platform, a nonprofit that advocates for the wrongfully convicted, to add to its public "Exonerated" showcase.

Use the web_search tool to find their profile on the National Registry of Exonerations (exonerationregistry.org). The Registry entry is ground truth. Pull facts only from what it (and corroborating news coverage you can verify) actually states — never invent a name, date, charge, sentence, statistic, or quote, and never assume a detail just because it's common in similar cases.

You'll be given the list of people Xonorate has already added to the site (by name, state, and source URL where known) — pick someone NOT already on that list. Prefer a well-documented case with enough detail in the Registry entry (or corroborating coverage) to cover most of what's asked below.

If you cannot find a single suitable, undocumented, well-documented candidate, set "found" to false and leave "brief" empty — never force a low-quality or duplicate pick.

If found, write "brief" as a thorough, well-organized plain-text research note covering everything you found, clearly labeled, so it can be extracted into structured fields afterward:
- Full name, state (full name, not abbreviated)
- 2-3 sentence factual summary of the case
- Charge, year convicted, sentence, and what contributed to the wrongful conviction
- Time served
- What led to the exoneration, and the year
- A single striking quote lifted verbatim from a source (a judge, witness, attorney, or the exoneree), if one exists — never write your own
- Any standalone numeric callouts worth surfacing (e.g. years served)
- Every documented fact relevant to: evidence of innocence, newly discovered evidence, due-process violations, and unreliable evidence used in the original conviction — note which of these four categories each fact belongs to

Set "sourceUrl" to the exact National Registry of Exonerations URL for this case's profile whenever found is true.`;

// Step 2: extract the brief into the full structured shape. No tools
// involved here, so the schema can be as complex as case-overview-extraction.ts's
// (which this mirrors) without hitting the same limit.
const evidenceItemSchema = z.object({ title: z.string(), body: z.string() });
const statSchema = z.object({ value: z.string(), label: z.string() });

const extractionSchema = z.object({
  clientName: z.string(),
  state: z.string(),
  summary: z.string(),
  charge: z.string(),
  yearConvicted: z.number().int().nullable(),
  sentence: z.string(),
  contributingFactors: z.string(),
  timeServed: z.string(),
  exonerationSummary: z.string(),
  exonerationYear: z.number().int().nullable(),
  pullQuote: z.string(),
  stats: z.array(statSchema),
  evidenceOfInnocence: z.array(evidenceItemSchema),
  newlyDiscoveredEvidence: z.array(evidenceItemSchema),
  dueProcessViolations: z.array(evidenceItemSchema),
  unreliableEvidence: z.array(evidenceItemSchema),
});

const EXTRACTION_SYSTEM = `You extract structured case data from a research brief about an exonerated person, for entry into Xonorate Media Platform's admin system.

The brief is ground truth. Pull facts only from what it actually states — never invent a name, date, charge, sentence, statistic, or quote, and never assume a detail just because it's common in similar cases. If a field isn't clearly stated in the brief, return an empty string (or empty array, or null for numbers) for it rather than guessing.

Field notes:
- state: the full US state name (e.g. "Texas"), not an abbreviation.
- yearConvicted / exonerationYear: numbers only, null if not stated.
- pullQuote: only include it if the brief marks it as a verbatim quote; otherwise "".
- The four evidence categories are fixed and must be used exactly as named: "Evidence of innocence", "Newly discovered evidence", "Due-process violations", "Unreliable evidence". Sort every fact from the brief into whichever category fits; leave a category's array empty if the brief has nothing for it. Each item is {title, body} — title is a short label, body is 1-3 sentences of supporting detail from the brief.`;

const CATEGORY_KEY_BY_FIELD: Record<
  (typeof EVIDENCE_CATEGORY_FIELDS)[number]["name"],
  keyof z.infer<typeof extractionSchema>
> = {
  evidenceOfInnocence: "evidenceOfInnocence",
  newlyDiscoveredEvidence: "newlyDiscoveredEvidence",
  dueProcessViolations: "dueProcessViolations",
  unreliableEvidence: "unreliableEvidence",
};

async function extractFromBrief(brief: string): Promise<CaseOverviewDraft> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: EXTRACTION_SYSTEM,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(extractionSchema),
    },
    messages: [
      {
        role: "user",
        content: `Extract this research brief's details into the given structure, following the grounding rules exactly.\n\n${brief}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to extract the researched candidate.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude did not return structured data for the researched candidate.");
  }

  const data = response.parsed_output;
  const categoryStrings = Object.fromEntries(
    EVIDENCE_CATEGORY_FIELDS.map(({ name }) => [
      name,
      serializeCategoryItems(data[CATEGORY_KEY_BY_FIELD[name]] as EvidenceItem[]),
    ]),
  ) as Record<(typeof EVIDENCE_CATEGORY_FIELDS)[number]["name"], string>;

  return {
    clientName: data.clientName,
    state: data.state,
    summary: data.summary,
    charge: data.charge,
    year: data.yearConvicted != null ? String(data.yearConvicted) : "",
    sentence: data.sentence,
    contributingFactors: data.contributingFactors,
    timeServed: data.timeServed,
    exonerationSummary: data.exonerationSummary,
    exonerationYear: data.exonerationYear != null ? String(data.exonerationYear) : "",
    pullQuote: data.pullQuote,
    stats: serializeStats(data.stats),
    ...categoryStrings,
    hasExoneration: Boolean(data.exonerationSummary && data.exonerationYear != null),
  };
}

/** Researches one new exonerated-person candidate from the National
 * Registry of Exonerations via Claude web search, grounded strictly in what
 * it finds — for an admin to review and correct before anything is saved
 * (see case-nre-candidates.ts / admin/cases/new/page.tsx). Two Claude calls:
 * a web-search research pass with a simple output schema, then a
 * no-tools extraction pass with the full structured schema (see the
 * "Schema is too complex" note above researchSchema for why this is split
 * in two rather than one combined call). Returns null if no suitable,
 * undocumented candidate is found rather than fabricating one. */
export async function researchCaseCandidate(
  roster: RosterEntry[],
): Promise<CaseCandidateDraft | null> {
  const rosterList =
    roster.length > 0
      ? roster.map((r) => `- ${r.clientName} (${r.state})${r.sourceUrl ? ` — ${r.sourceUrl}` : ""}`).join("\n")
      : "(Nothing added yet.)";

  const userPrompt = `Already on Xonorate's site — do not pick any of these:\n${rosterList}\n\nFind one new, well-documented, exonerated case from the National Registry of Exonerations to add.`;

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    output_config: {
      effort: "high",
      format: zodOutputFormat(researchSchema),
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to research a candidate.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude did not return a structured research result.");
  }

  const research = response.parsed_output;
  if (!research.found || !research.clientName || !research.sourceUrl || !research.brief) {
    return null;
  }

  const draft = await extractFromBrief(research.brief);
  return { ...draft, sourceUrl: research.sourceUrl };
}
