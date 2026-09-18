// Real-database test: a lovedOneId alone is not enough to authorize access —
// every loved-one query must also be scoped to the caller's own familyId.
// This is the specific guard getLovedOneForFamily/updateLovedOne/
// deleteLovedOne implement (see loved-ones.ts) and the case a bug here would
// let one family read or edit another family's loved one.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("loved-one cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-lo-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "LO Test Family A", ownerUserId: ownerA },
        { name: "LO Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const lovedOne = await lovedOnesLib.createLovedOne(familyA, { name: "Test Loved One" });
    lovedOneA = lovedOne.id;
  });

  afterAll(async () => {
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("finds the loved one under its own family", async () => {
    const row = await lovedOnesLib.getLovedOneForFamily(familyA, lovedOneA);
    expect(row?.id).toBe(lovedOneA);
  });

  it("returns null when the loved one is requested under a different family", async () => {
    const row = await lovedOnesLib.getLovedOneForFamily(familyB, lovedOneA);
    expect(row).toBeNull();
  });

  it("refuses to update a loved one scoped to a different family", async () => {
    const result = await lovedOnesLib.updateLovedOne(familyB, lovedOneA, {
      name: "Hijacked Name",
    });
    expect(result).toBeNull();

    const unchanged = await lovedOnesLib.getLovedOneForFamily(familyA, lovedOneA);
    expect(unchanged?.name).toBe("Test Loved One");
  });

  it("refuses to delete a loved one scoped to a different family", async () => {
    const result = await lovedOnesLib.deleteLovedOne(familyB, lovedOneA);
    expect(result).toBeNull();

    const stillThere = await lovedOnesLib.getLovedOneForFamily(familyA, lovedOneA);
    expect(stillThere).not.toBeNull();
  });
});
