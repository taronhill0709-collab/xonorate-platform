// Real-database test: same cross-family guard pattern as
// reentry-plan.integration.test.ts/parole-preparation.integration.test.ts/
// clemency-preparation.integration.test.ts.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("case overview cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let caseOverviewLib: typeof import("./case-overview");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    caseOverviewLib = await import("./case-overview");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-case-overview-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Case Overview Test Family A", ownerUserId: ownerA },
        { name: "Case Overview Test Family B", ownerUserId: ownerA },
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

  it("creates a case lazily, defaulting stage to unknown", async () => {
    const familyCase = await caseOverviewLib.ensureFamilyCaseForLovedOne(familyA, lovedOneA);
    expect(familyCase?.stage).toBe("unknown");
    expect(familyCase?.caseNumber).toBeNull();
  });

  it("is idempotent — a second call returns the same case", async () => {
    const first = await caseOverviewLib.ensureFamilyCaseForLovedOne(familyA, lovedOneA);
    const second = await caseOverviewLib.ensureFamilyCaseForLovedOne(familyA, lovedOneA);
    expect(second?.id).toBe(first?.id);
  });

  it("refuses to create a case for a loved one that doesn't belong to the caller's family", async () => {
    const familyCase = await caseOverviewLib.ensureFamilyCaseForLovedOne(familyB, lovedOneA);
    expect(familyCase).toBeNull();
  });

  it("refuses to update a case scoped to a different family", async () => {
    await caseOverviewLib.ensureFamilyCaseForLovedOne(familyA, lovedOneA);
    const result = await caseOverviewLib.updateFamilyCase(familyB, lovedOneA, { caseNumber: "Hijacked" });
    expect(result).toBeNull();

    const familyCase = await caseOverviewLib.getFamilyCaseForFamily(familyA, lovedOneA);
    expect(familyCase?.caseNumber).toBeNull();
  });

  it("updates a case's fields under the correct family", async () => {
    await caseOverviewLib.ensureFamilyCaseForLovedOne(familyA, lovedOneA);
    const result = await caseOverviewLib.updateFamilyCase(familyA, lovedOneA, {
      caseNumber: "2015-CR-001",
      stage: "sentenced",
    });
    expect(result).not.toBeNull();

    const familyCase = await caseOverviewLib.getFamilyCaseForFamily(familyA, lovedOneA);
    expect(familyCase?.caseNumber).toBe("2015-CR-001");
    expect(familyCase?.stage).toBe("sentenced");
  });
});
