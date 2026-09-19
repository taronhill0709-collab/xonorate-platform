import { db } from "@/db";
import { familyCasePeople } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { CasePersonType } from "@/family/case-people-types";

export type CasePersonInput = {
  personType: CasePersonType;
  name: string;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
  relationshipToCase?: string | null;
  notes?: string | null;
};

export async function createCasePerson(familyId: string, lovedOneId: string, input: CasePersonInput) {
  const [row] = await db
    .insert(familyCasePeople)
    .values({ familyId, lovedOneId, ...input })
    .returning();
  return row;
}

export async function listCasePeopleForLovedOne(familyId: string, lovedOneId: string) {
  return db
    .select()
    .from(familyCasePeople)
    .where(and(eq(familyCasePeople.familyId, familyId), eq(familyCasePeople.lovedOneId, lovedOneId)))
    .orderBy(asc(familyCasePeople.createdAt));
}

/** Same cross-family guard as every other family-scoped table: scopes on both personId and familyId. */
export async function getCasePersonForFamily(familyId: string, personId: string) {
  const [row] = await db
    .select()
    .from(familyCasePeople)
    .where(and(eq(familyCasePeople.id, personId), eq(familyCasePeople.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function updateCasePerson(
  familyId: string,
  personId: string,
  input: Partial<CasePersonInput>,
) {
  const [row] = await db
    .update(familyCasePeople)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(familyCasePeople.id, personId), eq(familyCasePeople.familyId, familyId)))
    .returning({ id: familyCasePeople.id });
  return row ?? null;
}

export async function deleteCasePerson(familyId: string, personId: string) {
  const [row] = await db
    .delete(familyCasePeople)
    .where(and(eq(familyCasePeople.id, personId), eq(familyCasePeople.familyId, familyId)))
    .returning({ id: familyCasePeople.id });
  return row ?? null;
}
