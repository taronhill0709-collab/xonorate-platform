import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { investigations } from "@/db/schema";

/** The homepage/Investigates "featured investigation" slot: whichever
 * published investigation an editor explicitly marked as featured (see the
 * checkbox in investigation-form.tsx — at most one row has isFeatured true
 * at a time), or, if none is, whichever published investigation is most
 * recent. Shared by page.tsx and news/page.tsx so the two surfaces never
 * disagree on which investigation is "featured". */
export async function getFeaturedInvestigation(): Promise<typeof investigations.$inferSelect | null> {
  const [manuallyFeatured] = await db
    .select()
    .from(investigations)
    .where(and(eq(investigations.isFeatured, true), eq(investigations.status, "published")))
    .limit(1);
  if (manuallyFeatured) return manuallyFeatured;

  const [mostRecent] = await db
    .select()
    .from(investigations)
    .where(eq(investigations.status, "published"))
    .orderBy(desc(investigations.publishedAt))
    .limit(1);
  return mostRecent ?? null;
}
