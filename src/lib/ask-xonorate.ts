import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  askQuestions,
  cases,
  investigationIssueLinks,
  investigations,
  knowledgeSourceIssueLinks,
  knowledgeSources,
  resourceIssueLinks,
  resources,
} from "@/db/schema";
import { ISSUES } from "@/lib/issues";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import { KNOWLEDGE_TOPICS } from "@/lib/knowledge-sources";

// Only these statuses have passed the source verification standard and may
// influence a public answer — "draft"/"under_review" are excluded even
// though the DB would happily return them.
const RETRIEVABLE_SOURCE_STATUSES = ["verified", "approved"] as const;

// Ask Xonorate — a research/legal-information assistant, not a lawyer and
// not a generic chatbot. Its entire credibility rests on one rule: it may
// only ever cite a knowledgeSources/resources/cases/investigations row that
// was actually retrieved for this question. It is never given web_search
// and never asked to answer from its own training knowledge for a legal
// citation, case name, or statute — see SYSTEM_PROMPT below. If the
// curated library doesn't yet cover a topic/jurisdiction, the correct
// answer is "this is a research gap," not a plausible-sounding guess.

export type RetrievedContext = {
  matchedIssueTags: string[];
  matchedJurisdiction: string | null;
  sources: (typeof knowledgeSources.$inferSelect)[];
  resourceRows: (typeof resources.$inferSelect)[];
  caseRows: { id: string; clientName: string; slug: string; summary: string }[];
  investigationRows: { id: string; title: string; slug: string; subtitle: string | null; summary: string }[];
};

const MAX_SOURCES = 12;
const MAX_RESOURCES = 6;
const MAX_CASES = 5;
const MAX_INVESTIGATIONS = 5;

/** Deterministic keyword match against the existing ISSUES taxonomy (causal
 * factors — what contributes to a wrongful conviction) PLUS
 * KNOWLEDGE_TOPICS (procedural/research subjects like "post-conviction
 * relief" that aren't a cause and so were never a resources/cases tag —
 * knowledgeSources needs that broader vocabulary since the foundational
 * library covers subjects ISSUES was never meant to). No embedding
 * search/vector DB needed at this scale. Errs toward matching too much
 * rather than too little; the generation step still only cites what's
 * actually relevant. Querying resourceIssueLinks/investigationIssueLinks/
 * cases.contributingFactorTags with a KNOWLEDGE_TOPICS tag mixed in is
 * harmless — those tables simply have no rows tagged with it. */
function matchIssueTags(question: string): string[] {
  const q = question.toLowerCase();
  const causalTags = ISSUES.filter((issue) => {
    const needles = [issue.tag, issue.title, ...issue.title.toLowerCase().split(/\s+/)];
    return needles.some((needle) => needle.length > 3 && q.includes(needle.toLowerCase()));
  }).map((issue) => issue.tag);
  const topicTags = KNOWLEDGE_TOPICS.filter((topic) => topic.keywords.some((k) => q.includes(k))).map(
    (topic) => topic.tag,
  );
  return [...causalTags, ...topicTags];
}

/** Matches a jurisdiction only on a full state name or "federal" — never on
 * the two-letter code, which would false-positive on ordinary words
 * ("in", "or", "hi"). Returns null (not "general") when nothing is
 * mentioned, so the caller can decide whether to ask for clarification. */
function matchJurisdiction(question: string): string | null {
  const q = question.toLowerCase();
  if (/\bfederal\b/.test(q)) return "federal";
  const hit = JURISDICTIONS.find((j) => j.code !== "federal" && j.code !== "general" && q.includes(j.label.toLowerCase()));
  return hit?.code ?? null;
}

// Stopwords excluded from title-word matching (matchByTitle below) — short
// common words that would otherwise match almost any source's title.
const TITLE_MATCH_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "what", "does", "about",
  "united", "states", "court", "case", "national", "report", "review",
]);

/** Falls back to matching a question against knowledgeSources titles
 * directly (e.g. "What is Brady?", "What is Miranda?") — matchIssueTags
 * alone only recognizes the ISSUES/KNOWLEDGE_TOPICS vocabulary, so a
 * question naming a doctrine or case by name (not by the underlying
 * causal/procedural topic) would otherwise retrieve nothing even when a
 * verified source for exactly that doctrine exists. Cheap at this scale —
 * the whole library is fetched once per question, not per source. */
function matchByTitle(
  question: string,
  allSources: (typeof knowledgeSources.$inferSelect)[],
): (typeof knowledgeSources.$inferSelect)[] {
  const q = question.toLowerCase();
  return allSources.filter((s) => {
    const words = s.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !TITLE_MATCH_STOPWORDS.has(w));
    return words.some((w) => new RegExp(`\\b${w}\\b`).test(q));
  });
}

export async function retrieveContext(question: string, jurisdictionHint?: string | null): Promise<RetrievedContext> {
  const matchedIssueTags = matchIssueTags(question);
  const matchedJurisdiction = jurisdictionHint ?? matchJurisdiction(question);

  const jurisdictionFilter = matchedJurisdiction
    ? or(eq(knowledgeSources.jurisdiction, matchedJurisdiction), isNull(knowledgeSources.jurisdiction))
    : undefined;

  const [tagMatchedRows, allRetrievableSources] = await Promise.all([
    matchedIssueTags.length > 0
      ? db
          .select({ source: knowledgeSources })
          .from(knowledgeSourceIssueLinks)
          .innerJoin(knowledgeSources, eq(knowledgeSourceIssueLinks.sourceId, knowledgeSources.id))
          .where(
            and(
              inArray(knowledgeSources.status, RETRIEVABLE_SOURCE_STATUSES),
              inArray(knowledgeSourceIssueLinks.issueTag, matchedIssueTags),
              jurisdictionFilter,
            ),
          )
          .limit(MAX_SOURCES * 2)
      : Promise.resolve([]),
    // Small table at this scale — fetched in full so matchByTitle can catch
    // a named doctrine/case the tag vocabulary doesn't cover.
    db
      .select()
      .from(knowledgeSources)
      .where(and(inArray(knowledgeSources.status, RETRIEVABLE_SOURCE_STATUSES), jurisdictionFilter)),
  ]);

  const titleMatched = matchByTitle(question, allRetrievableSources);
  // De-dupe (a source can match by tag and by title, or link to more than
  // one matched issue tag).
  const sources = Array.from(
    new Map([...tagMatchedRows.map((r) => r.source), ...titleMatched].map((s) => [s.id, s])).values(),
  )
    .sort((a, b) => a.authorityTier - b.authorityTier)
    .slice(0, MAX_SOURCES);

  const resourceRows =
    matchedIssueTags.length > 0
      ? await db
          .select({ resource: resources })
          .from(resourceIssueLinks)
          .innerJoin(resources, eq(resourceIssueLinks.resourceId, resources.id))
          .where(and(eq(resources.status, "published"), inArray(resourceIssueLinks.issueTag, matchedIssueTags)))
          .limit(MAX_RESOURCES)
      : [];
  const resourceRowsUnique = Array.from(new Map(resourceRows.map((r) => [r.resource.id, r.resource])).values()).slice(
    0,
    MAX_RESOURCES,
  );

  const caseRows =
    matchedIssueTags.length > 0
      ? await db
          .select({
            id: cases.id,
            clientName: cases.clientName,
            slug: cases.slug,
            summary: cases.summary,
            contributingFactorTags: cases.contributingFactorTags,
          })
          .from(cases)
          .limit(200) // small table; filter in JS below rather than a jsonb-contains query per tag
      : [];
  const matchedCases = caseRows
    .filter((c) => {
      const tags = (c.contributingFactorTags as string[] | null) ?? [];
      return tags.some((t) => matchedIssueTags.includes(t));
    })
    .slice(0, MAX_CASES)
    .map(({ id, clientName, slug, summary }) => ({ id, clientName, slug, summary }));

  const investigationRows =
    matchedIssueTags.length > 0
      ? await db
          .select({
            id: investigations.id,
            title: investigations.title,
            slug: investigations.slug,
            subtitle: investigations.subtitle,
            summary: investigations.summary,
          })
          .from(investigationIssueLinks)
          .innerJoin(investigations, eq(investigationIssueLinks.investigationId, investigations.id))
          .where(and(eq(investigations.status, "published"), inArray(investigationIssueLinks.issueTag, matchedIssueTags)))
          .limit(MAX_INVESTIGATIONS)
      : [];
  const investigationRowsUnique = Array.from(
    new Map(investigationRows.map((r) => [r.id, r])).values(),
  ).slice(0, MAX_INVESTIGATIONS);

  return {
    matchedIssueTags,
    matchedJurisdiction,
    sources,
    resourceRows: resourceRowsUnique,
    caseRows: matchedCases,
    investigationRows: investigationRowsUnique,
  };
}

const askAnswerSchema = z.object({
  needsClarification: z.boolean().describe("True only if the question genuinely cannot be usefully answered without more information (most importantly: jurisdiction, when the question turns on what a state's law says)."),
  clarifyingQuestions: z.array(z.string()).max(5).describe("Only the questions that would materially change the answer — never generic filler."),
  shortAnswer: z.string().nullable().describe("The clearest useful answer in 2-4 sentences. Null if needsClarification is true and nothing useful can be said yet."),
  whatLawSays: z.string().nullable().describe("What the LAW says, in Markdown, built ONLY from the cited knowledge sources below — never from general legal knowledge. Null if no cited source actually covers this."),
  relevantFactors: z.string().nullable().describe("What may be relevant to the asker's situation, in Markdown, framed as 'may be relevant' / 'raises a question worth examining' — never as a legal conclusion about their specific case."),
  questionsToInvestigate: z.array(z.string()).describe("A research checklist tailored to this specific question — never generic."),
  questionsForCounsel: z.array(z.string()).describe("Specific questions the asker could bring to a qualified attorney — empty if the question has nothing to do with an individual legal situation."),
  citedSourceIds: z.array(z.string()).describe("IDs of knowledgeSources rows actually relied on, from the provided list only."),
  relatedResourceIds: z.array(z.string()).describe("IDs of the provided resources actually relevant to this question."),
  relatedCaseIds: z.array(z.string()).describe("IDs of the provided cases actually relevant to this question."),
  relatedInvestigationIds: z.array(z.string()).describe("IDs of the provided investigations actually relevant to this question."),
  researchGap: z.boolean().describe("True if the curated library doesn't yet cover something the question needed — this feeds Xonorate's editorial research queue."),
  researchGapNote: z.string().nullable().describe("If researchGap is true, a short plain note on what's missing (e.g. 'no curated source for New Jersey post-conviction DNA testing statute'). Null otherwise."),
});

export type AskAnswer = z.infer<typeof askAnswerSchema>;

const SYSTEM_PROMPT = `You are Ask Xonorate, the research assistant for Xonorate — a wrongful-conviction media, research, and advocacy nonprofit. Xonorate is NOT a law firm. You are not the user's attorney, not legal counsel, and you never represent a court or government agency.

You provide legal information, research, issue-spotting, and suggested questions for further investigation — never individualized legal advice or a legal conclusion about someone's specific case. Never say things like "you have a violation," "this proves," "you are entitled to," or "the prosecutor committed misconduct" unless you are directly quoting/attributing an authoritative source's own holding. Prefer careful language: "may," "can," "has been associated with," "raises a question worth examining," "records indicate," "according to [source]."

THE SINGLE MOST IMPORTANT RULE: you may ONLY cite a source, case, statute, resource, Xonorate case, or investigation that is explicitly given to you below in CONTEXT, by the exact id provided. Never invent, recall from training, or "fill in" a citation, case name, statute, court holding, quote, or statistic — even a real, famous one — if it is not in CONTEXT. If CONTEXT does not cover something the question needs, say so plainly (researchGap: true) rather than answering from general knowledge. This is a hard constraint, not a style preference.

Distinguish, in your own writing, between: WHAT THE LAW SAYS (only from cited knowledgeSources), WHAT RESEARCH SHOWS (from cited tier-3 knowledgeSources or resource content), WHAT XONORATE HAS DOCUMENTED (from cited resources/cases/investigations), and POTENTIAL ISSUES WORTH EXAMINING (your own careful synthesis, always framed as a question rather than a conclusion).

Jurisdiction matters enormously for legal questions. If the question depends on state law and no jurisdiction was given or matched, set needsClarification and ask which state (or federal court) is relevant before giving jurisdiction-specific legal information — you may still give general, non-jurisdiction-specific information in shortAnswer.

Never provide financial, medical, or individualized legal advice. Never state that someone should file a particular motion, that their case "qualifies," or that they will win.`;

function buildUserPrompt(question: string, jurisdiction: string | null, context: RetrievedContext): string {
  const sourceBlocks = context.sources.map(
    (s) =>
      `- id: ${s.id} | tier ${s.authorityTier} | ${s.sourceKind} | "${s.title}"${s.citation ? ` (${s.citation})` : ""}${s.jurisdiction ? ` | jurisdiction: ${s.jurisdiction}` : ""}\n  summary: ${s.summary}${s.url ? `\n  url: ${s.url}` : ""}`,
  );
  const resourceBlocks = context.resourceRows.map((r) => {
    const parts = [
      r.overview ? `overview: ${r.overview}` : null,
      r.whyItMatters ? `why it matters: ${r.whyItMatters}` : null,
      r.howItHappens ? `how it happens: ${r.howItHappens}` : null,
      r.whatToKnow ? `what to know: ${r.whatToKnow}` : null,
      r.whatToLookFor ? `what to look for: ${r.whatToLookFor}` : null,
      r.xonorateFindings ? `what Xonorate has found: ${r.xonorateFindings}` : null,
      r.body ? `body: ${r.body}` : null,
    ].filter(Boolean);
    return `- id: ${r.id} | "${r.title}"\n  ${r.description}\n  ${parts.join("\n  ")}`;
  });
  const caseBlocks = context.caseRows.map((c) => `- id: ${c.id} | "${c.clientName}"\n  ${c.summary}`);
  const investigationBlocks = context.investigationRows.map(
    (i) => `- id: ${i.id} | "${i.title}"${i.subtitle ? ` — ${i.subtitle}` : ""}\n  ${i.summary}`,
  );

  return [
    `QUESTION: ${question}`,
    jurisdiction ? `JURISDICTION PROVIDED: ${jurisdiction}` : "JURISDICTION PROVIDED: none",
    "",
    "CONTEXT — you may cite ONLY items listed below, by their id:",
    "",
    "KNOWLEDGE SOURCES (legal authorities, research, organizations):",
    sourceBlocks.length > 0 ? sourceBlocks.join("\n\n") : "(none retrieved for this question)",
    "",
    "XONORATE RESOURCES:",
    resourceBlocks.length > 0 ? resourceBlocks.join("\n\n") : "(none retrieved for this question)",
    "",
    "XONORATE CASES:",
    caseBlocks.length > 0 ? caseBlocks.join("\n\n") : "(none retrieved for this question)",
    "",
    "XONORATE INVESTIGATIONS:",
    investigationBlocks.length > 0 ? investigationBlocks.join("\n\n") : "(none retrieved for this question)",
  ].join("\n");
}

export async function generateAskAnswer(
  question: string,
  jurisdiction: string | null,
  context: RetrievedContext,
): Promise<AskAnswer> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "high", format: zodOutputFormat(askAnswerSchema) },
    messages: [{ role: "user", content: buildUserPrompt(question, jurisdiction, context) }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Ask Xonorate: model returned no parsed output.");
  }
  return response.parsed_output;
}

/** Strips any id the model returned that wasn't actually part of the
 * retrieved context — the defense against a hallucinated citation/id
 * slipping through structured output. */
function sanitizeAnswer(answer: AskAnswer, context: RetrievedContext): AskAnswer {
  const validSourceIds = new Set(context.sources.map((s) => s.id));
  const validResourceIds = new Set(context.resourceRows.map((r) => r.id));
  const validCaseIds = new Set(context.caseRows.map((c) => c.id));
  const validInvestigationIds = new Set(context.investigationRows.map((i) => i.id));
  return {
    ...answer,
    citedSourceIds: answer.citedSourceIds.filter((id) => validSourceIds.has(id)),
    relatedResourceIds: answer.relatedResourceIds.filter((id) => validResourceIds.has(id)),
    relatedCaseIds: answer.relatedCaseIds.filter((id) => validCaseIds.has(id)),
    relatedInvestigationIds: answer.relatedInvestigationIds.filter((id) => validInvestigationIds.has(id)),
  };
}

export type ResolvedCitation = {
  id: string;
  title: string;
  sourceKind?: string;
  citation?: string | null;
  organization?: string | null;
  url?: string | null;
  slug?: string;
  summary?: string;
};

export type AskAnswerResolved = AskAnswer & {
  citedSources: ResolvedCitation[];
  relatedResources: ResolvedCitation[];
  relatedCases: ResolvedCitation[];
  relatedInvestigations: ResolvedCitation[];
};

function resolveDisplayData(answer: AskAnswer, context: RetrievedContext): AskAnswerResolved {
  return {
    ...answer,
    citedSources: context.sources
      .filter((s) => answer.citedSourceIds.includes(s.id))
      .map((s) => ({ id: s.id, title: s.title, sourceKind: s.sourceKind, citation: s.citation, organization: s.organization, url: s.url })),
    relatedResources: context.resourceRows
      .filter((r) => answer.relatedResourceIds.includes(r.id))
      .map((r) => ({ id: r.id, title: r.title, slug: r.slug, summary: r.description })),
    relatedCases: context.caseRows
      .filter((c) => answer.relatedCaseIds.includes(c.id))
      .map((c) => ({ id: c.id, title: c.clientName, slug: c.slug, summary: c.summary })),
    relatedInvestigations: context.investigationRows
      .filter((i) => answer.relatedInvestigationIds.includes(i.id))
      .map((i) => ({ id: i.id, title: i.title, slug: i.slug, summary: i.summary })),
  };
}

/** The full pipeline: retrieve -> generate -> sanitize -> persist. Called
 * only from ask-xonorate-background.mts (see the note on
 * content-draft.ts's USES_WEB_SEARCH for why AI calls run in a background
 * function rather than inline — high-effort structured generation can
 * still run past a synchronous function's ~10s budget). */
export async function answerAskQuestion(
  question: string,
  jurisdiction: string | null,
  sessionToken: string | null,
): Promise<{ questionId: string; answer: AskAnswerResolved }> {
  const context = await retrieveContext(question, jurisdiction);
  const rawAnswer = await generateAskAnswer(question, jurisdiction ?? context.matchedJurisdiction, context);
  const answer = sanitizeAnswer(rawAnswer, context);

  const status = answer.needsClarification ? "needs_clarification" : answer.researchGap ? "research_gap" : "answered";

  const [row] = await db
    .insert(askQuestions)
    .values({
      question,
      jurisdiction: jurisdiction ?? context.matchedJurisdiction,
      issueTags: context.matchedIssueTags,
      status,
      shortAnswer: answer.shortAnswer,
      answerSections: {
        whatLawSays: answer.whatLawSays,
        relevantFactors: answer.relevantFactors,
        questionsToInvestigate: answer.questionsToInvestigate,
        questionsForCounsel: answer.questionsForCounsel,
        researchGapNote: answer.researchGapNote,
      },
      needsClarification: answer.needsClarification,
      clarifyingQuestions: answer.clarifyingQuestions,
      citedSourceIds: answer.citedSourceIds,
      relatedResourceIds: answer.relatedResourceIds,
      relatedCaseIds: answer.relatedCaseIds,
      relatedInvestigationIds: answer.relatedInvestigationIds,
      sessionToken,
    })
    .returning({ id: askQuestions.id });

  return { questionId: row.id, answer: resolveDisplayData(answer, context) };
}
