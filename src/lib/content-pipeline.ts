import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { petitions, posts } from "@/db/schema";
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

Research requirements:
- Use the web_search tool to find REAL, RECENT news stories (published within the last several days). Every claim about a specific case, statistic, or event must be backed by a real source you found — never fabricate a case detail or statistic.
- Separately, always search the National Registry of Exonerations and at least one innocence organization (Innocence Project, Innocence Network, Exoneration Project, or a relevant state innocence organization) for current statistics and case data to ground the post — do this on every run, not only when news is thin. Cite what you find with a real source.
- Include real data or context on how often these things happen and common contributing patterns (eyewitness misidentification, false confessions, forensic misconduct, prosecutorial misconduct, etc.), citing where the data comes from.
- Include concrete actions a reader can take: contact information for relevant oversight bodies (state innocence projects, police oversight boards, judicial conduct commissions) tied to the stories covered.
- You'll be given a list of this organization's currently active petitions with their URLs. Naturally reference one or two only where genuinely relevant to a story you found — don't force it, and don't reference one if none fit.

If today's news is thin:
- Cover fewer stories rather than inventing any. It's fine for a roundup to lean more heavily on Registry/innocence-org data and older-but-still-relevant developments than on breaking news.
- If you genuinely find little or nothing recent, say so in one plain sentence (e.g. "There wasn't much new wrongful-conviction news in the last few days, so today's roundup leans on the data.") and move on to the data/action sections. Never claim that a search tool, wire monitor, or any part of your own process failed or was unavailable — that is never true, and inventing a system failure as an excuse is itself a fabrication and is strictly forbidden.

Formatting requirements:
- Write in Markdown, roughly 600-1200 words.
- Populate "sources" with every real URL you cited, each with a short descriptive title. List the source that best represents the post's lead story FIRST — its page image is what gets used as the post's photo, so put a real news article with a strong, relevant photo ahead of PDFs, data pages, or organization landing pages when you have the choice.
- Only set "state" if the post centers on one particular state.`;

async function draftRoundup(): Promise<PostDraft> {
  const origin = getSiteOrigin();

  const activePetitions = await db
    .select({ title: petitions.title, slug: petitions.slug, askText: petitions.askText })
    .from(petitions)
    .where(eq(petitions.status, "published"))
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

export async function generateDailyPost(): Promise<{ id: string; title: string }> {
  // Idempotency guard: skip if a roundup was already generated today.
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

  const draft = await draftRoundup();
  const imageUrl = await fetchFirstSourceImage(draft.sources);

  const row = await insertWithUniqueSlug(draft.title, (slug) =>
    db
      .insert(posts)
      .values({
        type: "daily_roundup",
        title: draft.title,
        slug,
        body: draft.body,
        sources: draft.sources,
        imageUrl,
        state: draft.state ?? null,
        status: "pending",
        autoGenerated: true,
      })
      .returning({ id: posts.id, title: posts.title }),
  );

  await notifyAdminOfDraft(row.id, row.title);

  return { id: row.id, title: row.title };
}

async function notifyAdminOfDraft(postId: string, title: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.log(`[content-pipeline] Draft "${title}" ready — set ADMIN_NOTIFICATION_EMAIL to get notified.`);
    return;
  }

  const reviewUrl = `${getSiteOrigin()}/admin/posts/${postId}`;
  await sendMail({
    to: adminEmail,
    subject: `New draft post awaiting review: ${title}`,
    text: `A new roundup post was auto-generated and is awaiting your review before it can publish.\n\n${title}\n\nReview it here: ${reviewUrl}`,
    html: `<p>A new roundup post was auto-generated and is awaiting your review before it can publish.</p><p><strong>${title}</strong></p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
  });
}
