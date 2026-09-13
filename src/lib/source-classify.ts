import { db } from "@/db";
import { cases } from "@/db/schema";
import { enrichStory, resolveSuggestedCaseId } from "@/lib/content-pipeline";

export type SourceClassification = {
  whyThisMatters: string;
  whatToWatch: string[];
  state: string | null;
  issueTags: string[];
  suggestedCaseId: string | null;
};

/** Runs the same editorial classification the daily discovery pipeline
 * (content-pipeline.ts's enrichStory) applies to every AI-discovered story
 * — issue tags, "why this matters", follow-ups to watch, a matching
 * existing case — but on demand, for a source an editor typed in
 * themselves via "Add a source of your own" (content-sources.ts), which
 * never goes through discovery and so is never classified otherwise. */
export async function classifySource(input: {
  headline: string;
  sourcePublication: string;
  summary: string;
}): Promise<SourceClassification> {
  const roster = await db.select({ id: cases.id, clientName: cases.clientName, state: cases.state }).from(cases);

  const enrichment = await enrichStory(
    { headline: input.headline, sourcePublication: input.sourcePublication, snippet: input.summary },
    roster,
  );

  return {
    whyThisMatters: enrichment.whyThisMatters,
    whatToWatch: enrichment.whatToWatch,
    state: enrichment.state,
    issueTags: enrichment.issueTags,
    suggestedCaseId: resolveSuggestedCaseId(enrichment.suggestedCaseName, roster),
  };
}
