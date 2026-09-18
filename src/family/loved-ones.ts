import { db } from "@/db";
import { facilities, lovedOnes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type DateConfidence = "confirmed" | "approximate" | "unknown";

export type LovedOneDates = {
  arrestDate?: string | null;
  arrestDateConfidence?: DateConfidence;
  convictionDate?: string | null;
  convictionDateConfidence?: DateConfidence;
  paroleEligibilityDate?: string | null;
  paroleEligibilityDateConfidence?: DateConfidence;
  paroleHearingDate?: string | null;
  paroleHearingDateConfidence?: DateConfidence;
  expectedReleaseDate?: string | null;
  expectedReleaseDateConfidence?: DateConfidence;
};

export type LovedOneInput = LovedOneDates & {
  name: string;
  preferredName?: string | null;
  inmateId?: string | null;
  facilityId?: string | null;
  state?: string | null;
  sentenceLength?: string | null;
  currentStatus?: string | null;
};

export async function createLovedOne(familyId: string, input: LovedOneInput) {
  const [row] = await db
    .insert(lovedOnes)
    .values({ familyId, ...input })
    .returning();
  return row;
}

export async function listLovedOnesForFamily(familyId: string) {
  return db
    .select({
      id: lovedOnes.id,
      name: lovedOnes.name,
      preferredName: lovedOnes.preferredName,
      currentStatus: lovedOnes.currentStatus,
      facilityName: facilities.name,
      facilityState: facilities.state,
      // Included for the dashboard's "what needs attention"/"upcoming"
      // sections (see src/family/dashboard.ts) — harmless extra columns for
      // callers (e.g. the nav) that only need id/name.
      arrestDate: lovedOnes.arrestDate,
      convictionDate: lovedOnes.convictionDate,
      paroleEligibilityDate: lovedOnes.paroleEligibilityDate,
      paroleHearingDate: lovedOnes.paroleHearingDate,
      expectedReleaseDate: lovedOnes.expectedReleaseDate,
    })
    .from(lovedOnes)
    .leftJoin(facilities, eq(lovedOnes.facilityId, facilities.id))
    .where(eq(lovedOnes.familyId, familyId));
}

/**
 * The one place every loved-one Server Action goes through to load a row.
 * Scoping the WHERE clause on both lovedOneId AND familyId (rather than
 * fetching by id and checking familyId in application code afterward) means
 * a lovedOneId that belongs to a different family always comes back as "not
 * found" here — never trust a client-supplied lovedOneId + familyId pair
 * without this join. See loved-ones.integration.test.ts for the case this
 * guards against.
 */
export async function getLovedOneForFamily(familyId: string, lovedOneId: string) {
  const [row] = await db
    .select({
      id: lovedOnes.id,
      familyId: lovedOnes.familyId,
      name: lovedOnes.name,
      preferredName: lovedOnes.preferredName,
      inmateId: lovedOnes.inmateId,
      facilityId: lovedOnes.facilityId,
      facilityName: facilities.name,
      facilityState: facilities.state,
      state: lovedOnes.state,
      arrestDate: lovedOnes.arrestDate,
      arrestDateConfidence: lovedOnes.arrestDateConfidence,
      convictionDate: lovedOnes.convictionDate,
      convictionDateConfidence: lovedOnes.convictionDateConfidence,
      sentenceLength: lovedOnes.sentenceLength,
      currentStatus: lovedOnes.currentStatus,
      paroleEligibilityDate: lovedOnes.paroleEligibilityDate,
      paroleEligibilityDateConfidence: lovedOnes.paroleEligibilityDateConfidence,
      paroleHearingDate: lovedOnes.paroleHearingDate,
      paroleHearingDateConfidence: lovedOnes.paroleHearingDateConfidence,
      expectedReleaseDate: lovedOnes.expectedReleaseDate,
      expectedReleaseDateConfidence: lovedOnes.expectedReleaseDateConfidence,
    })
    .from(lovedOnes)
    .leftJoin(facilities, eq(lovedOnes.facilityId, facilities.id))
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

/** Returns null (rather than throwing) when lovedOneId doesn't belong to familyId — same cross-family guard as getLovedOneForFamily. */
export async function updateLovedOne(
  familyId: string,
  lovedOneId: string,
  input: Partial<LovedOneInput>,
) {
  const [row] = await db
    .update(lovedOnes)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .returning({ id: lovedOnes.id });
  return row ?? null;
}

export async function deleteLovedOne(familyId: string, lovedOneId: string) {
  const [row] = await db
    .delete(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .returning({ id: lovedOnes.id });
  return row ?? null;
}
