import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, desc, eq, isNotNull, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cases, petitions, posts } from "@/db/schema";
import { sendMail } from "@/lib/email";
import { fetchFirstSourceImage } from "@/lib/fetch-source-image";
import { getSiteOrigin } from "@/lib/site-url";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

const postDraftSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1).describe("Full post body in Markdown."),
  sources: z
    .array(z.object({ url: z.string(), title: z.string() }))
    .min(1)
    .describe("Every real source cited in the post."),
  state: z
    .string()
    .optional()
    .describe("Two-letter or full US state name this post specifically concerns, if any."),
});

type PostDraft = z.infer<typeof postDraftSchema>;

async function draftWithClaude(system: string, userPrompt: string): Promise<PostDraft> {
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    output_config: {
      effort: "high",
      format: zodOutputFormat(postDraftSchema),
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to generate this post.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude did not return a structured draft.");
  }
  return response.parsed_output;
}

const ROUNDUP_SYSTEM = `You are the daily content writer for Xonorate Media Platform, a nonprofit that advocates for the wrongfully convicted.

Write a "roundup" post: today's news on wrongful convictions, police misconduct, and judicial discipline or removal.

Requirements:
- Use the web_search tool to find REAL, RECENT news stories (published within the last several days). Every claim about a specific case, statistic, or event must be backed by a real source you found — never fabricate a case detail or statistic.
- Include real data or context on how often these things happen and common contributing patterns (eyewitness misidentification, false confessions, forensic misconduct, prosecutorial misconduct, etc.), citing where the data comes from.
- Include concrete actions a reader can take: contact information for relevant oversight bodies (state innocence projects, police oversight boards, judicial conduct commissions) tied to the stories covered.
- You'll be given a list of this organization's currently active petitions with their URLs. Naturally reference one or two only where genuinely relevant to a story you found — don't force it, and don't reference one if none fit.
- If you can't find enough real recent stories, cover fewer stories rather than inventing any.
- Write in Markdown, roughly 600-1200 words.
- Populate "sources" with every real URL you cited, each with a short descriptive title.
- Only set "state" if the post centers on one particular state.`;

const SPOTLIGHT_SYSTEM = `You are the daily content writer for Xonorate Media Platform, a nonprofit that advocates for the wrongfully convicted.

Write a "case spotlight" post about the client case described in the user message. Those case facts come from Xonorate's own case files and are ground truth — do not alter, embellish, or add unstated details to them.

Cover:
- What contributed to the conviction
- Time served
- What led to the exoneration
- This state's policy on compensating the wrongfully convicted — use the web_search tool to find the state's ACTUAL current compensation statute or policy (or confirm it has none), and cite a real, current source. Do not guess.
- The (very common) reality that exonerees often receive no or inadequate compensation — cite real supporting data if you can find it.
- What a reader can do to push for reform (contacting state legislators, supporting compensation-reform advocacy, and — if a petition URL is provided below — signing it).

Requirements:
- Never invent a fact about the case itself; use only what's given.
- Every claim about the state's compensation policy or general compensation statistics must be backed by a real source found via web_search.
- Write in Markdown, roughly 500-900 words.
- Open the body with 1-2 narrative sentences that tell the reader who this person is and what happened — this lead is used verbatim as the preview text on the homepage and post listings, so it must read as a sentence, not data. Do NOT start the body with a bolded fact line (e.g. "**State:** Ohio | **Charge:** ..."), a table, or a bare link — those can appear later in the piece, never first.
- Populate "sources" with every real URL cited.
- Set "state" to the case's state.`;

type ConvictionDetails = {
  charge: string;
  year: number;
  sentence: string;
  contributingFactors: string;
};

type ExonerationDetails = { whatLedToExoneration: string; year: number } | null;

async function findSpotlightCandidate() {
  const alreadySpotlighted = db
    .select({ id: posts.caseId })
    .from(posts)
    .where(and(eq(posts.type, "case_spotlight"), isNotNull(posts.caseId)));

  const [candidate] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.status, "exonerated"), notInArray(cases.id, alreadySpotlighted)))
    .orderBy(cases.createdAt)
    .limit(1);

  return candidate ?? null;
}

async function draftSpotlight(caseRow: typeof cases.$inferSelect): Promise<PostDraft> {
  const conviction = caseRow.convictionDetails as ConvictionDetails;
  const exoneration = caseRow.exonerationDetails as ExonerationDetails;
  const origin = getSiteOrigin();

  const [linkedPetition] = await db
    .select({ slug: petitions.slug, title: petitions.title })
    .from(petitions)
    .where(eq(petitions.caseId, caseRow.id))
    .orderBy(desc(petitions.createdAt))
    .limit(1);

  const userPrompt = `Case: ${caseRow.clientName}
State: ${caseRow.state}
Summary: ${caseRow.summary}
Charge: ${conviction.charge}
Year convicted: ${conviction.year}
Sentence: ${conviction.sentence}
What contributed to the conviction: ${conviction.contributingFactors}
Time served: ${caseRow.timeServed ?? "not recorded"}
${
  exoneration
    ? `Year exonerated: ${exoneration.year}\nWhat led to exoneration: ${exoneration.whatLedToExoneration}`
    : "Exoneration details: not recorded"
}
Case page: ${origin}/cases/${caseRow.slug}
${linkedPetition ? `Petition to reference: ${linkedPetition.title} — ${origin}/petitions/${linkedPetition.slug}` : "No petition is linked to this case yet — don't reference one."}`;

  return draftWithClaude(SPOTLIGHT_SYSTEM, userPrompt);
}

async function draftRoundup(): Promise<PostDraft> {
  const origin = getSiteOrigin();

  const activePetitions = await db
    .select({ title: petitions.title, slug: petitions.slug, askText: petitions.askText })
    .from(petitions)
    .orderBy(desc(petitions.createdAt))
    .limit(5);

  const petitionList =
    activePetitions.length > 0
      ? activePetitions
          .map((p) => `- ${p.title}: ${p.askText} — ${origin}/petitions/${p.slug}`)
          .join("\n")
      : "(No active petitions right now — don't reference any.)";

  const userPrompt = `Today's date: ${new Date().toISOString().slice(0, 10)}

Xonorate's currently active petitions:
${petitionList}`;

  return draftWithClaude(ROUNDUP_SYSTEM, userPrompt);
}

export async function generateDailyPost(): Promise<{
  id: string;
  title: string;
  type: "case_spotlight" | "daily_roundup";
}> {
  const candidate = await findSpotlightCandidate();
  const type = candidate ? ("case_spotlight" as const) : ("daily_roundup" as const);

  // Idempotency guard: if no spotlight candidate, check whether a roundup
  // already exists for today before generating a new one
  if (type === "daily_roundup") {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [existingRoundup] = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(and(eq(posts.type, "daily_roundup"), eq(posts.autoGenerated, true)))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    if (existingRoundup && existingRoundup.createdAt >= todayStart) {
      throw new Error(
        "[daily-content-background] roundup already generated today, skipping to prevent duplicates",
      );
    }
  }

  const draft = candidate ? await draftSpotlight(candidate) : await draftRoundup();
  const imageUrl = await fetchFirstSourceImage(draft.sources);

  const row = await insertWithUniqueSlug(draft.title, (slug) =>
    db
      .insert(posts)
      .values({
        type,
        title: draft.title,
        slug,
        body: draft.body,
        sources: draft.sources,
        imageUrl,
        state: draft.state ?? (candidate ? candidate.state : null),
        caseId: candidate?.id ?? null,
        status: "pending",
        autoGenerated: true,
      })
      .returning({ id: posts.id, title: posts.title }),
  );

  await notifyAdminOfDraft(row.id, row.title, type);

  return { id: row.id, title: row.title, type };
}

async function notifyAdminOfDraft(
  postId: string,
  title: string,
  type: "case_spotlight" | "daily_roundup",
) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.log(`[content-pipeline] Draft "${title}" ready — set ADMIN_NOTIFICATION_EMAIL to get notified.`);
    return;
  }

  const reviewUrl = `${getSiteOrigin()}/admin/posts/${postId}`;
  await sendMail({
    to: adminEmail,
    subject: `New draft post awaiting review: ${title}`,
    text: `A new ${type === "case_spotlight" ? "case spotlight" : "roundup"} post was auto-generated and is awaiting your review before it can publish.\n\n${title}\n\nReview it here: ${reviewUrl}`,
    html: `<p>A new ${type === "case_spotlight" ? "case spotlight" : "roundup"} post was auto-generated and is awaiting your review before it can publish.</p><p><strong>${title}</strong></p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
  });
}
