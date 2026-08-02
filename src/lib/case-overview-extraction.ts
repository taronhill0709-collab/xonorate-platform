import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  EVIDENCE_CATEGORY_FIELDS,
  serializeCategoryItems,
  serializeStats,
  type EvidenceItem,
} from "@/lib/innocence-claim";

export class InvalidCaseDocumentError extends Error {}

const MAX_BYTES = 15 * 1024 * 1024;

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

const SYSTEM = `You extract structured case data from an attorney's wrongful-conviction case overview, for entry into Xonorate Media Platform's admin system.

The document is ground truth. Pull facts only from what it actually states — never invent a name, date, charge, sentence, statistic, or quote, and never assume a detail just because it's common in similar cases. If a field isn't clearly stated in the document, return an empty string (or empty array, or null for numbers) for it rather than guessing.

Field notes:
- state: the full US state name (e.g. "Texas"), not an abbreviation.
- summary: 2-3 sentences, plain factual overview of the case.
- yearConvicted / exonerationYear: numbers only, null if not stated. exonerationYear and exonerationSummary should stay empty/null if the document describes an ongoing case with no exoneration yet.
- pullQuote: a single striking sentence lifted verbatim from the document (e.g. from a judge, witness, or attorney), or "" if nothing suitable exists. Never write your own.
- stats: short standalone numeric callouts the document supports (e.g. years served, number of pieces of evidence), each as {value, label}. Leave empty if the document doesn't support any.
- The four evidence categories are fixed and must be used exactly as named: "Evidence of innocence", "Newly discovered evidence", "Due-process violations", "Unreliable evidence". Sort every fact from the document into whichever category fits; leave a category's array empty if the document has nothing for it. Each item is {title, body} — title is a short label, body is 1-3 sentences of supporting detail from the document.`;

export type CaseOverviewDraft = {
  clientName: string;
  state: string;
  summary: string;
  charge: string;
  year: string;
  sentence: string;
  contributingFactors: string;
  timeServed: string;
  exonerationSummary: string;
  exonerationYear: string;
  pullQuote: string;
  stats: string;
  evidenceOfInnocence: string;
  newlyDiscoveredEvidence: string;
  dueProcessViolations: string;
  unreliableEvidence: string;
  hasExoneration: boolean;
};

const CATEGORY_KEY_BY_FIELD: Record<
  (typeof EVIDENCE_CATEGORY_FIELDS)[number]["name"],
  keyof z.infer<typeof extractionSchema>
> = {
  evidenceOfInnocence: "evidenceOfInnocence",
  newlyDiscoveredEvidence: "newlyDiscoveredEvidence",
  dueProcessViolations: "dueProcessViolations",
  unreliableEvidence: "unreliableEvidence",
};

/** Reads an attorney-submitted case overview PDF and drafts the admin case
 * form fields from it via Claude — grounded strictly in the document, for
 * the admin to review and correct before saving (see cases/actions.ts). */
export async function extractCaseOverview(file: File): Promise<CaseOverviewDraft> {
  if (file.type !== "application/pdf") {
    throw new InvalidCaseDocumentError("Case overview must be a PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidCaseDocumentError("Case overview PDF must be smaller than 15MB.");
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(extractionSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          {
            type: "text",
            text: "Extract this case's details into the given structure, following the grounding rules exactly.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new InvalidCaseDocumentError("Claude declined to process this document.");
  }
  if (!response.parsed_output) {
    throw new InvalidCaseDocumentError("Couldn't extract structured data from this PDF.");
  }
  if (!response.parsed_output.clientName) {
    throw new InvalidCaseDocumentError(
      "Couldn't find a client name in this document — check it's the right file.",
    );
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
