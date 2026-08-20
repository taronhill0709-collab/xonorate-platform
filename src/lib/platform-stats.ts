import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { cases, petitions, signatures, siteSettings } from "@/db/schema";
import type { CaseImpact } from "@/lib/case-impact";

export type PlatformStat = { value: string; label: string };

type ConvictionYear = { year: number };
type ExonerationYear = { year: number } | null;

/** Live rollup of Xonorate's own case and petition data — distinct from the
 * cited national estimates on the homepage. Each stat is omitted rather
 * than shown as zero when there's nothing to count yet. */
export async function getPlatformStats(): Promise<PlatformStat[]> {
  const allCaseRows = await db
    .select({
      status: cases.status,
      state: cases.state,
      convictionDetails: cases.convictionDetails,
      exonerationDetails: cases.exonerationDetails,
      impact: cases.impact,
      isClient: cases.isClient,
    })
    .from(cases);

  // Spotlight cases (isClient: false) are cases we're raising awareness of,
  // not ones we represent — excluded from stats that claim to count "our
  // clients".
  const caseRows = allCaseRows.filter((c) => c.isClient);

  const totalClients = caseRows.length;

  const [settings] = await db
    .select({ socialViewsLabel: siteSettings.socialViewsLabel })
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"))
    .limit(1);
  const socialViewsLabel = settings?.socialViewsLabel?.trim() || null;

  const yearsLost = caseRows.reduce((total, c) => {
    const conviction = c.convictionDetails as ConvictionYear;
    const exoneration = c.exonerationDetails as ExonerationYear;
    if (exoneration && exoneration.year > conviction.year) {
      return total + (exoneration.year - conviction.year);
    }
    return total;
  }, 0);

  const childrenAffected = caseRows.reduce((total, c) => {
    const impact = c.impact as CaseImpact | null;
    const n = impact?.facts.numberOfChildren;
    return total + (typeof n === "number" && n > 0 ? n : 0);
  }, 0);

  const statesRepresented = new Set(
    caseRows.map((c) => c.state.trim().toLowerCase()).filter(Boolean),
  ).size;

  const publishedPetitions = await db
    .select({ id: petitions.id, startingSignatureCount: petitions.startingSignatureCount })
    .from(petitions)
    .where(eq(petitions.status, "published"));

  const petitionSignatureCounts = await Promise.all(
    publishedPetitions.map((p) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(and(eq(signatures.petitionId, p.id), eq(signatures.verified, true)))
        .then(([r]) => (r?.value ?? 0) + p.startingSignatureCount),
    ),
  );
  const totalSignatures = petitionSignatureCounts.reduce((total, n) => total + n, 0);

  // Ordered for narrative flow, not by size: who we represent, how far
  // that's reached, the human cost, then what people are doing about it.
  const stats: PlatformStat[] = [];
  if (totalClients > 0) {
    stats.push({
      value: totalClients.toLocaleString(),
      label: totalClients === 1 ? "Client represented" : "Clients represented",
    });
  }
  if (statesRepresented > 0) {
    stats.push({
      value: statesRepresented.toLocaleString(),
      label: statesRepresented === 1 ? "State represented" : "States represented",
    });
  }
  if (socialViewsLabel) {
    stats.push({
      value: socialViewsLabel,
      label: "Views generated on social media",
    });
  }
  if (yearsLost > 0) {
    stats.push({
      value: yearsLost.toLocaleString(),
      label: "Years collectively lost, across our clients",
    });
  }
  if (childrenAffected > 0) {
    stats.push({
      value: childrenAffected.toLocaleString(),
      label:
        childrenAffected === 1
          ? "Child who grew up without a parent"
          : "Children who grew up without a parent",
    });
  }
  if (totalSignatures > 0) {
    stats.push({
      value: totalSignatures.toLocaleString(),
      label: "Petition signatures collected",
    });
  }

  return stats;
}
