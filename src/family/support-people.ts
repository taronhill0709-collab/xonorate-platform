import { db } from "@/db";
import { supportPeople, lovedOnes } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type SupportPersonInput = {
  lovedOneId?: string | null;
  name: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  canHelpWith?: string[] | null;
  notes?: string | null;
};

export async function createSupportPerson(familyId: string, input: SupportPersonInput) {
  const [row] = await db
    .insert(supportPeople)
    .values({ familyId, ...input })
    .returning();
  return row;
}

export async function listSupportPeopleForFamily(
  familyId: string,
  filter?: { lovedOneId?: string },
) {
  return db
    .select({
      id: supportPeople.id,
      lovedOneId: supportPeople.lovedOneId,
      lovedOneName: lovedOnes.name,
      name: supportPeople.name,
      relationship: supportPeople.relationship,
      email: supportPeople.email,
      phone: supportPeople.phone,
      role: supportPeople.role,
      canHelpWith: supportPeople.canHelpWith,
      notes: supportPeople.notes,
    })
    .from(supportPeople)
    .leftJoin(lovedOnes, eq(supportPeople.lovedOneId, lovedOnes.id))
    .where(
      filter?.lovedOneId
        ? and(eq(supportPeople.familyId, familyId), eq(supportPeople.lovedOneId, filter.lovedOneId))
        : eq(supportPeople.familyId, familyId),
    )
    .orderBy(desc(supportPeople.createdAt));
}

/** Same cross-family guard as loved-ones.ts/calendar.ts/documents.ts: scopes on both personId and familyId. */
export async function getSupportPersonForFamily(familyId: string, personId: string) {
  const [row] = await db
    .select()
    .from(supportPeople)
    .where(and(eq(supportPeople.id, personId), eq(supportPeople.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function updateSupportPerson(
  familyId: string,
  personId: string,
  input: Partial<SupportPersonInput>,
) {
  const [row] = await db
    .update(supportPeople)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(supportPeople.id, personId), eq(supportPeople.familyId, familyId)))
    .returning({ id: supportPeople.id });
  return row ?? null;
}

export async function deleteSupportPerson(familyId: string, personId: string) {
  const [row] = await db
    .delete(supportPeople)
    .where(and(eq(supportPeople.id, personId), eq(supportPeople.familyId, familyId)))
    .returning({ id: supportPeople.id });
  return row ?? null;
}
