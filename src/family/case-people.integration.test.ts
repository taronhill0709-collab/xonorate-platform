// Real-database test: same cross-family guard pattern as every other
// family-scoped table.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("case people cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let casePeopleLib: typeof import("./case-people");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    casePeopleLib = await import("./case-people");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-case-people-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Case People Test Family A", ownerUserId: ownerA },
        { name: "Case People Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const lovedOne = await lovedOnesLib.createLovedOne(familyA, { name: "Test Loved One" });
    lovedOneA = lovedOne.id;
  });

  afterAll(async () => {
    await db.delete(schema.familyCasePeople).where(eq(schema.familyCasePeople.familyId, familyA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("creates and lists people scoped to the correct family", async () => {
    await casePeopleLib.createCasePerson(familyA, lovedOneA, { personType: "attorney", name: "Jane Smith" });
    const rows = await casePeopleLib.listCasePeopleForLovedOne(familyA, lovedOneA);
    expect(rows.some((r) => r.name === "Jane Smith")).toBe(true);

    const wrongFamily = await casePeopleLib.listCasePeopleForLovedOne(familyB, lovedOneA);
    expect(wrongFamily).toHaveLength(0);
  });

  it("returns null when a person is requested under a different family", async () => {
    const person = await casePeopleLib.createCasePerson(familyA, lovedOneA, {
      personType: "witness",
      name: "John Doe",
    });
    const wrongFamily = await casePeopleLib.getCasePersonForFamily(familyB, person.id);
    expect(wrongFamily).toBeNull();

    const rightFamily = await casePeopleLib.getCasePersonForFamily(familyA, person.id);
    expect(rightFamily?.id).toBe(person.id);
  });

  it("refuses to update or delete a person scoped to a different family", async () => {
    const person = await casePeopleLib.createCasePerson(familyA, lovedOneA, {
      personType: "investigator",
      name: "Original Name",
    });

    const updateResult = await casePeopleLib.updateCasePerson(familyB, person.id, { name: "Hijacked" });
    expect(updateResult).toBeNull();

    const deleteResult = await casePeopleLib.deleteCasePerson(familyB, person.id);
    expect(deleteResult).toBeNull();

    const stillThere = await casePeopleLib.getCasePersonForFamily(familyA, person.id);
    expect(stillThere?.name).toBe("Original Name");
  });
});
