import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { desc, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cases, intelligenceItems } from "@/db/schema";
import { CONTRIBUTING_FACTOR_TAGS } from "@/lib/contributing-factors";
import { sendMail } from "@/lib/email";
import { fetchSourceImage } from "@/lib/fetch-source-image";
import { getSiteOrigin } from "@/lib/site-url";

type RosterEntry = { clientName: string; state: string };

// Step 1: discover distinct stories via web_search. Kept to a flat schema —
// combining the web_search tool with a large structured schema hits
// Anthropic's "Schema is too complex" limit (confirmed live on this project;
// see nre-case-research.ts for the same split). Classification/enrichment of
// each story happens separately in enrichStory(), below.
const discoveredStorySchema = z.object({
  headline: z.string(),
  sourcePublication: z.string(),
  sourceUrl: z.string(),
  publishedDate: z.string().optional().describe("The article's own publish date as YYYY-MM-DD, if determinable."),
  snippet: z.string().describe("1-3 factual sentences on what the story actually reports — no editorializing."),
  clusterKey: z
    .string()
    .optional()
    .describe(
      "Give two or more stories the SAME clusterKey only if they clearly report the same underlying event from different outlets. Leave empty otherwise.",
    ),
});

const discoverySchema = z.object({
  thin: z
    .boolean()
    .describe("True if genuinely little or no new relevant news exists today — never a reason to invent stories."),
  stories: z.array(discoveredStorySchema).max(15),
});

type DiscoveredStory = z.infer<typeof discoveredStorySchema>;

const DISCOVERY_SYSTEM = `You are Xonorate Intelligence, the automated discovery system for Xonorate Media Platform, a nonprofit that advocates for the wrongfully convicted.

Find real, distinct news stories from the last several days about wrongful convictions, exonerations, police misconduct, prosecutorial misconduct, and judicial discipline or removal. Also check the National Registry of Exonerations and at least one innocence organization (Innocence Project, Innocence Network, Exoneration Project, or a relevant state innocence organization) for a newly posted case or notable update, even on a slow news day.

Requirements:
- Use the web_search tool to find REAL stories. Every headline, publication, URL, and date must be something you actually found — never fabricate one.
- Report each story SEPARATELY, one entry per distinct piece of coverage — do not merge several stories into one combined summary.
- If two or more of the stories you found are clearly the same underlying event covered by different outlets, give them the same clusterKey (any short string of your choosing); leave clusterKey empty otherwise.

If today's news is genuinely thin, return fewer stories rather than inventing any — returning zero is fine. Set "thin" to true in that case. Never claim that a search tool, wire monitor, or any part of your own process failed or was unavailable — that is never true, and inventing a system failure as an excuse is itself a fabrication and is strictly forbidden.`;

async function discoverStories(): Promise<{ stories: DiscoveredStory[]; thin: boolean }> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: DISCOVERY_SYSTEM,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 10 }],
    output_config: {
      effort: "high",
      format: zodOutputFormat(discoverySchema),
    },
    messages: [{ role: "user", content: `Today's date: ${new Date().toISOString().slice(0, 10)}` }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to discover today's stories.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude did not return a structured discovery result.");
  }
  return response.parsed_output;
}

// Step 2: classify/enrich one already-discovered story. No tools involved,
// so (unlike discovery) this schema can carry every editorial field without
// hitting the schema-complexity limit.
const enrichmentSchema = z.object({
  state: z.string().nullable(),
  county: z.string().nullable(),
  issueTags: z.array(z.enum(CONTRIBUTING_FACTOR_TAGS)).default([]),
  editorialSignal: z.enum(["high_priority", "important", "routine", "duplicate", "low_relevance"]),
  contentOpportunity: z
    .enum(["news_brief", "case_development", "analysis", "investigation", "explainer", "watch", "resource"])
    .nullable(),
  whyThisMatters: z.string(),
  whatToWatch: z.array(z.string()).default([]),
  suggestedCaseName: z
    .string()
    .nullable()
    .describe("One of Xonorate's existing case names, copied EXACTLY as given, if the story clearly concerns it."),
});

export type Enrichment = z.infer<typeof enrichmentSchema>;

const ENRICHMENT_SYSTEM = `You classify one story discovered by Xonorate Intelligence for editorial triage. You're given only the headline, source, and a short snippet — never use outside knowledge beyond what's given; if something isn't stated, leave it null/empty rather than guessing.

Field notes:
- state/county: the full US state name (not an abbreviation) and county the story concerns, if any; null otherwise.
- issueTags: zero or more of the fixed contributing-factor categories that clearly apply — never guess one just because it's common in similar stories.
- editorialSignal: "high_priority" for a potential investigation or major case development; "important" for something worth publishing or analyzing; "routine" for a useful brief; "duplicate" if it just restates something already well covered; "low_relevance" if it barely concerns wrongful convictions.
- contentOpportunity: your single best suggestion for what Xonorate could turn this into, or null if nothing fits well. This is only a suggestion for a human editor, never a decision.
- whyThisMatters: 1-3 sentences on why this could matter to Xonorate's audience — a draft for an editor to review, never a settled conclusion.
- whatToWatch: zero or more short follow-ups worth watching for (a hearing, a ruling, a filing, an appeal) — only if the story actually suggests one.
- suggestedCaseName: only if the story clearly and specifically concerns one of Xonorate's existing cases (given below) — copy that name exactly. Null otherwise; never guess.`;

/** The subset of a discovered story enrichStory actually needs — lets it
 * also classify a manually-added source (content-sources.ts), which has no
 * publishedDate/clusterKey to speak of. */
type EnrichableStory = { headline: string; sourcePublication: string; snippet: string };

export async function enrichStory(story: EnrichableStory, roster: RosterEntry[]): Promise<Enrichment> {
  const rosterList =
    roster.length > 0 ? roster.map((r) => `- ${r.clientName} (${r.state})`).join("\n") : "(No cases on Xonorate yet.)";

  const userPrompt = `Xonorate's existing cases:\n${rosterList}\n\nStory to classify:\nHeadline: ${story.headline}\nSource: ${story.sourcePublication}\nSnippet: ${story.snippet}`;

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2000,
    system: ENRICHMENT_SYSTEM,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(enrichmentSchema),
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  // A single story's classification failing shouldn't sink the whole day's
  // discovery run — fall back to a safe, low-signal default so the story
  // still lands in the queue for a human to triage by hand.
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return {
      state: null,
      county: null,
      issueTags: [],
      editorialSignal: "routine",
      contentOpportunity: null,
      whyThisMatters: "",
      whatToWatch: [],
      suggestedCaseName: null,
    };
  }
  return response.parsed_output;
}

/** Case-insensitive exact match only — a fuzzy match risks silently
 * attaching a story to the wrong real person's case. */
export function resolveSuggestedCaseId(
  name: string | null,
  roster: { id: string; clientName: string }[],
): string | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  return roster.find((r) => r.clientName.trim().toLowerCase() === normalized)?.id ?? null;
}

function parsePublishedDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Runs Xonorate Intelligence's daily discovery pass: finds today's
 * real, distinct wrongful-conviction stories (Discover), classifies each
 * one for editorial triage (Enrich), and stages them as `intelligenceItems`
 * rows for an admin to review at /admin/intelligence. Replaces the old
 * generateDailyPost, which wrote one composite article a day — this stages
 * individual sources instead, so an editor decides what (if anything) each
 * one becomes. Nothing here publishes anything. */
export async function generateDailyIntelligence(): Promise<{ discovered: number; highPriority: number }> {
  // Idempotency guard: skip if today's discovery run already happened.
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [latest] = await db
    .select({ createdAt: intelligenceItems.createdAt })
    .from(intelligenceItems)
    .orderBy(desc(intelligenceItems.createdAt))
    .limit(1);

  if (latest && latest.createdAt >= todayStart) {
    throw new Error("[content-pipeline] intelligence already discovered today, skipping to prevent duplicates");
  }

  const { stories, thin } = await discoverStories();
  if (stories.length === 0) {
    console.log(`[content-pipeline] no stories discovered today${thin ? " (thin news day)" : ""}`);
    return { discovered: 0, highPriority: 0 };
  }

  // Dedup by exact source URL against the last two weeks — the same event
  // resurfacing across outlets on the same day is handled by clusterKey
  // above, not this check.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ sourceUrl: intelligenceItems.sourceUrl })
    .from(intelligenceItems)
    .where(gte(intelligenceItems.createdAt, fourteenDaysAgo));
  const seenUrls = new Set(recent.map((r) => r.sourceUrl));
  const newStories = stories.filter((s) => !seenUrls.has(s.sourceUrl));

  const roster = await db.select({ id: cases.id, clientName: cases.clientName, state: cases.state }).from(cases);

  const clusterKeyToId = new Map<string, string>();
  let discovered = 0;
  let highPriority = 0;

  for (const story of newStories) {
    try {
      const enrichment = await enrichStory(story, roster);
      const sourceImageUrl = await fetchSourceImage(story.sourceUrl).catch(() => null);

      let clusterId: string | null = null;
      if (story.clusterKey) {
        clusterId = clusterKeyToId.get(story.clusterKey) ?? crypto.randomUUID();
        clusterKeyToId.set(story.clusterKey, clusterId);
      }

      await db.insert(intelligenceItems).values({
        headline: story.headline,
        sourcePublication: story.sourcePublication,
        sourceUrl: story.sourceUrl,
        sourceImageUrl,
        publishedAt: parsePublishedDate(story.publishedDate),
        summary: story.snippet,
        state: enrichment.state,
        county: enrichment.county,
        issueTags: enrichment.issueTags,
        suggestedCaseId: resolveSuggestedCaseId(enrichment.suggestedCaseName, roster),
        editorialSignal: enrichment.editorialSignal,
        contentOpportunity: enrichment.contentOpportunity,
        whyThisMatters: enrichment.whyThisMatters || null,
        whatToWatch: enrichment.whatToWatch,
        clusterId,
      });

      discovered++;
      if (enrichment.editorialSignal === "high_priority") highPriority++;
    } catch (err) {
      console.error(`[content-pipeline] failed to enrich/save story "${story.headline}"`, err);
    }
  }

  await notifyAdminOfIntelligence(discovered, highPriority);
  return { discovered, highPriority };
}

async function notifyAdminOfIntelligence(count: number, highPriorityCount: number): Promise<void> {
  if (count === 0) return;

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.log(
      `[content-pipeline] ${count} new ${count === 1 ? "story" : "stories"} discovered (${highPriorityCount} high priority) — set ADMIN_NOTIFICATION_EMAIL to get notified.`,
    );
    return;
  }

  const reviewUrl = `${getSiteOrigin()}/admin/intelligence`;
  const priorityNote = highPriorityCount > 0 ? `, ${highPriorityCount} flagged high priority` : "";
  await sendMail({
    to: adminEmail,
    subject: `Xonorate Intelligence: ${count} new ${count === 1 ? "story" : "stories"} discovered${highPriorityCount > 0 ? ` (${highPriorityCount} high priority)` : ""}`,
    text: `Xonorate Intelligence discovered ${count} new ${count === 1 ? "story" : "stories"} today${priorityNote}.\n\nReview them here: ${reviewUrl}`,
    html: `<p>Xonorate Intelligence discovered <strong>${count}</strong> new ${count === 1 ? "story" : "stories"} today${priorityNote}.</p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
  });
}
