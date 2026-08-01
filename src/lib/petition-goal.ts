import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { petitions, signatures } from "@/db/schema";

/** Doubles repeatedly until the goal is strictly ahead of the actual count —
 * handles the rare case where many signatures verify at once and a single
 * doubling wouldn't be enough to clear it. */
function nextGoal(currentGoal: number, actualCount: number): number {
  let goal = currentGoal;
  while (goal <= actualCount) {
    goal *= 2;
  }
  return goal;
}

/**
 * Doubles a petition's signature goal once it's been reached, so the
 * progress bar never sits at "100% — done" and looks stale. Call this right
 * after a signature is newly verified — both the immediate (logged-in) path
 * and the confirm-link (guest) path need to call it separately, since
 * verification happens in two different places.
 */
export async function maybeEscalatePetitionGoal(petitionId: string): Promise<void> {
  const [petition] = await db
    .select({
      goalCount: petitions.goalCount,
      startingSignatureCount: petitions.startingSignatureCount,
    })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);
  if (!petition) return;

  const [{ value: verifiedCount }] = await db
    .select({ value: count() })
    .from(signatures)
    .where(and(eq(signatures.petitionId, petitionId), eq(signatures.verified, true)));

  const actualCount = verifiedCount + petition.startingSignatureCount;
  if (actualCount < petition.goalCount) return;

  const newGoal = nextGoal(petition.goalCount, actualCount);
  if (newGoal !== petition.goalCount) {
    await db.update(petitions).set({ goalCount: newGoal }).where(eq(petitions.id, petitionId));
  }
}
