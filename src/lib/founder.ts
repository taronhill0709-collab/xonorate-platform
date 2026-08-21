import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cases, siteSettings } from "@/db/schema";

// Xonorate's founder has his own case page — this is what makes the "why
// we exist" pitch on the homepage and About page a real, verifiable story
// rather than a mission statement. Null if that case doesn't exist (e.g. a
// fresh environment before it's been created).
export const FOUNDER_CASE_SLUG = "taron-hill";

export async function getFounderCase() {
  const [[caseRow], [settings]] = await Promise.all([
    db
      .select({ clientName: cases.clientName, slug: cases.slug })
      .from(cases)
      .where(eq(cases.slug, FOUNDER_CASE_SLUG))
      .limit(1),
    db
      .select({ founderPhotoUrl: siteSettings.founderPhotoUrl })
      .from(siteSettings)
      .where(eq(siteSettings.id, "singleton"))
      .limit(1),
  ]);

  if (!caseRow) return null;

  // Deliberately not caseRow.photoUrl — the founder sections use a
  // dedicated photo (set on /admin/settings) so it can differ from
  // whatever's on the case page itself.
  return { ...caseRow, photoUrl: settings?.founderPhotoUrl ?? null };
}
