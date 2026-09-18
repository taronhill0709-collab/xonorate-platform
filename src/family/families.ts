import { db } from "@/db";
import { families, familyMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Creates a family and makes the creator its active owner in one transaction. */
export async function createFamilyWithOwner(userId: string, name: string) {
  return db.transaction(async (tx) => {
    const [family] = await tx
      .insert(families)
      .values({ name, ownerUserId: userId })
      .returning();

    await tx.insert(familyMembers).values({
      familyId: family.id,
      userId,
      role: "owner",
      status: "active",
    });

    return family;
  });
}

export async function getFamily(familyId: string) {
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);
  return family ?? null;
}
