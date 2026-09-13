import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { contentSources, contentSourceTargetEnum, intelligenceItems, posts } from "@/db/schema";

/** Attaches one or more discovered sources to a piece of Xonorate content
 * (a post or an investigation): records provenance (contentSources), flips
 * each source to "used" so the Source Library and Intelligence dashboard
 * stop counting it as backlog, and — for posts only — appends it to the
 * legacy freeform `sources` list so existing rendering keeps working
 * (investigations have no such legacy field). */
export async function attachContentSources(
  targetType: (typeof contentSourceTargetEnum.enumValues)[number],
  targetId: string,
  intelligenceItemIds: string[],
): Promise<void> {
  if (intelligenceItemIds.length === 0) return;

  const items = await db.select().from(intelligenceItems).where(inArray(intelligenceItems.id, intelligenceItemIds));
  if (items.length === 0) return;

  await db.insert(contentSources).values(items.map((item) => ({ intelligenceItemId: item.id, targetType, targetId })));
  await db
    .update(intelligenceItems)
    .set({ status: "used" })
    .where(inArray(intelligenceItems.id, items.map((i) => i.id)));

  if (targetType === "post") {
    const [post] = await db.select({ sources: posts.sources }).from(posts).where(eq(posts.id, targetId)).limit(1);
    const existingSources = (post?.sources as { url: string; title: string }[]) ?? [];
    const newSources = items.map((i) => ({ url: i.sourceUrl, title: i.headline }));
    await db
      .update(posts)
      .set({ sources: [...existingSources, ...newSources] })
      .where(eq(posts.id, targetId));
  }
}

export async function removeContentSourceRow(contentSourceId: string): Promise<void> {
  await db.delete(contentSources).where(eq(contentSources.id, contentSourceId));
}

/** Lets an editor attach a source Xonorate Intelligence never discovered —
 * an article they found themselves. Every source (see attachContentSources
 * above) has to be an intelligenceItems row, so this creates one on the fly
 * (already "used", since it's being attached immediately) rather than
 * requiring the discovery pipeline to have found it first. Returns null if
 * the form's manual-source fields were left blank (nothing to add). */
export async function createManualSourceIfProvided(formData: FormData): Promise<string | null> {
  const sourceUrl = String(formData.get("manualSourceUrl") ?? "").trim();
  if (!sourceUrl) return null;

  const headline = String(formData.get("manualSourceHeadline") ?? "").trim() || sourceUrl;
  const sourcePublication = String(formData.get("manualSourcePublication") ?? "").trim() || "Unknown source";
  const summary = String(formData.get("manualSourceSummary") ?? "").trim() || headline;

  const [item] = await db
    .insert(intelligenceItems)
    .values({
      headline,
      sourcePublication,
      sourceUrl,
      summary,
      status: "used",
      editorialSignal: "routine",
    })
    .returning({ id: intelligenceItems.id });

  return item.id;
}
