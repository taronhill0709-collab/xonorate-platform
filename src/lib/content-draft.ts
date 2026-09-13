import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const draftSchema = z.object({ body: z.string().min(1).describe("Full body in Markdown.") });

export type ContentDraftInput = {
  type: string;
  headline: string;
  sourcePublication: string;
  sourceUrl: string;
  summary: string;
  whyThisMatters: string | null;
  issueTags: string[];
  caseName: string | null;
};

// Analysis and Explainer are Xonorate's "more than a summary" tiers (spec:
// "Xonorate adds original context and explanation") — they get web_search
// so the draft can ground itself in real statistics/legal context instead
// of just restating the source. News Brief/Case Development/Watch/Resource
// stay source-only: fast, and there's nothing beyond the source to search for.
//
// IMPORTANT: draftContentBody must only ever be called from
// content-draft-background.mts (a background function, 15-minute budget),
// never inline from a page render or a plain Server Action — a web_search
// call at high effort reliably takes 20-40+ seconds, which blew straight
// through the ~10s synchronous request budget and crashed in production
// ("An unexpected response was received from the server") before this was
// moved behind the job-queue/polling pattern in content-draft-jobs.ts +
// draft-body-button.tsx (same pattern as case-overview-jobs.ts).
const USES_WEB_SEARCH = new Set(["analysis", "explainer"]);

const SHARED_GROUNDING_RULE =
  "Never invent a fact, quote, statistic, or detail about this specific story beyond what's given below — if you need more specifics than that to make a point, speak generally (\"cases like this often...\") rather than fabricating a specific one.";

function systemPromptFor(type: string): string {
  switch (type) {
    case "news_brief":
      return `You write a Xonorate News Brief — a short, factual public update based primarily on the source story given to you. Xonorate is a media/advocacy nonprofit for the wrongfully convicted.

150-300 words. Lead with what happened, plainly. Credit the source publication by name — this is aggregated reporting, not original Xonorate reporting, so never imply Xonorate broke this news. ${SHARED_GROUNDING_RULE}`;

    case "case_development":
      return `You write a Xonorate Case Development — a short update connected to one of Xonorate's own cases, based on the source story given to you. Xonorate is a media/advocacy nonprofit for the wrongfully convicted.

150-350 words. State what developed and, if given, which Xonorate case it concerns and why it matters for that case specifically. Credit the source publication — this is a development note, not original investigative reporting. ${SHARED_GROUNDING_RULE}`;

    case "analysis":
      return `You write Xonorate Analysis — Xonorate's original context and explanation of a development, going beyond a news summary. Xonorate is a media/advocacy nonprofit that exposes wrongful convictions and holds the system accountable. Write with that voice: direct and clear-eyed about what's at stake, not neutral wire-service copy that could run anywhere.

Use the web_search tool to ground the analysis in real, current data: national statistics on the relevant issue (from the National Registry of Exonerations, Innocence Project, or similar), legal context, or comparable/pattern cases — cite what you actually find. ${SHARED_GROUNDING_RULE} Never fabricate a citation either — only cite something you actually found via search.

The analysis must do real work, not just restate the development:
- State what happened, credited to the source publication.
- Make the seriousness of it explicit and concrete: is this an isolated incident or part of a documented pattern? What does it put at risk — wrongful convictions left unexamined, ongoing cases, public trust in the office or system involved? Ground this in what you actually found, and never inflate a claim beyond what's documented — but don't hedge a genuinely serious finding into blandness either.
- Connect it to the broader systemic issue it represents, using the real context/statistics you found.
- Close by making clear why this shouldn't be overlooked — what happens, or keeps happening, if it is.

500-900 words. Open with the development itself, then build the case for why it matters — the analysis is the point, not a retelling.`;

    case "explainer":
      return `You write a Xonorate Explainer — educational content on a wrongful-conviction issue, using the given story as the occasion for it. Xonorate is a media/advocacy nonprofit that exposes wrongful convictions and holds the system accountable — write with that voice: direct about the stakes, not a neutral textbook entry.

Use the web_search tool to ground the explanation in real sources (the National Registry of Exonerations, Innocence Project, academic or legal sources) — cite what you actually find, never fabricate a citation or statistic.

500-800 words. Explain how/why the underlying issue happens in general (e.g. how eyewitness misidentification occurs, how official misconduct like this recurs) in plain language for a reader with no legal background — and be explicit about why it matters: how often it contributes to wrongful convictions, and what's lost (years of someone's life, public trust, cases never revisited) when it isn't caught or addressed.`;

    case "watch":
      return `You write a brief Xonorate "Watch" note — flagging a topic or development Xonorate is following, based on the source story given to you. Xonorate is a media/advocacy nonprofit for the wrongfully convicted.

150-300 words. State what's happening and what to watch for next (a hearing, ruling, filing, or related development). ${SHARED_GROUNDING_RULE}`;

    case "resource":
      return `You write a short Xonorate "Resource" note introducing a useful piece of public information, research, or organization, based on the source given to you. Xonorate is a media/advocacy nonprofit for the wrongfully convicted.

100-250 words. Plainly describe what the resource is and why it's useful to someone following wrongful-conviction issues. ${SHARED_GROUNDING_RULE}`;

    default:
      return `You write short Xonorate editorial content based on the source story given to you. Xonorate is a media/advocacy nonprofit for the wrongfully convicted. 200-400 words. ${SHARED_GROUNDING_RULE}`;
  }
}

/** Drafts a real body for a post created via "Create With This" — replacing
 * the bare 1-3 sentence discovery snippet that used to be the entire
 * prefilled body. Falls back to that same bare snippet (never blocks
 * content creation) if Claude declines or returns nothing. Only ever call
 * this from content-draft-background.mts — see the note on USES_WEB_SEARCH
 * above for why. */
export async function draftContentBody(input: ContentDraftInput): Promise<string> {
  const useSearch = USES_WEB_SEARCH.has(input.type);

  const userPrompt = [
    `Headline: ${input.headline}`,
    `Source: ${input.sourcePublication} (${input.sourceUrl})`,
    `What the source reports: ${input.summary}`,
    input.whyThisMatters ? `Editorial note on why this matters: ${input.whyThisMatters}` : null,
    input.issueTags.length > 0 ? `Relevant issue(s): ${input.issueTags.join(", ")}` : null,
    input.caseName ? `Potentially related Xonorate case: ${input.caseName}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: systemPromptFor(input.type),
    ...(useSearch ? { tools: [{ type: "web_search_20260209" as const, name: "web_search", max_uses: 6 }] } : {}),
    output_config: {
      effort: useSearch ? "high" : "medium",
      format: zodOutputFormat(draftSchema),
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return `${input.summary}\n\nSource: [${input.sourcePublication}](${input.sourceUrl})`;
  }
  return response.parsed_output.body;
}
