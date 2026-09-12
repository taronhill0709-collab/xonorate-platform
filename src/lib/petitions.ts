import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { cases, petitions, signatures } from "@/db/schema";

export type PetitionWithProgress = {
  id: string;
  title: string;
  slug: string;
  askText: string;
  goalCount: number;
  recipientName: string | null;
  caseClientName: string | null;
  caseSlug: string | null;
  signatureCount: number;
  percentComplete: number;
  signedThisWeek: number;
};

/** Shared by /petitions and /take-action — both need the same published
 * petitions enriched with a live signature count and this-week momentum. */
export async function getPublishedPetitionsWithProgress(): Promise<PetitionWithProgress[]> {
  const rows = await db
    .select({
      id: petitions.id,
      title: petitions.title,
      slug: petitions.slug,
      askText: petitions.askText,
      goalCount: petitions.goalCount,
      startingSignatureCount: petitions.startingSignatureCount,
      recipientName: petitions.recipientName,
      caseClientName: cases.clientName,
      caseSlug: cases.slug,
    })
    .from(petitions)
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .where(eq(petitions.status, "published"))
    .orderBy(desc(petitions.createdAt));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return Promise.all(
    rows.map(async (row) => {
      const [[verifiedCount], [thisWeekCount]] = await Promise.all([
        db
          .select({ value: count() })
          .from(signatures)
          .where(and(eq(signatures.petitionId, row.id), eq(signatures.verified, true))),
        db
          .select({ value: count() })
          .from(signatures)
          .where(
            and(
              eq(signatures.petitionId, row.id),
              eq(signatures.verified, true),
              gte(signatures.createdAt, sevenDaysAgo),
            ),
          ),
      ]);

      const signatureCount = (verifiedCount?.value ?? 0) + row.startingSignatureCount;

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        askText: row.askText,
        goalCount: row.goalCount,
        recipientName: row.recipientName,
        caseClientName: row.caseClientName,
        caseSlug: row.caseSlug,
        signatureCount,
        percentComplete: Math.min(100, Math.round((signatureCount / row.goalCount) * 100)),
        signedThisWeek: thisWeekCount?.value ?? 0,
      };
    }),
  );
}
