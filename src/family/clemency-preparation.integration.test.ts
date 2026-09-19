// Real-database test: same cross-family guard pattern as
// reentry-plan.integration.test.ts/parole-preparation.integration.test.ts.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("clemency preparation cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let clemencyLib: typeof import("./clemency-preparation");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    clemencyLib = await import("./clemency-preparation");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-clemency-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Clemency Test Family A", ownerUserId: ownerA },
        { name: "Clemency Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const lovedOne = await lovedOnesLib.createLovedOne(familyA, { name: "Test Loved One" });
    lovedOneA = lovedOne.id;
  });

  afterAll(async () => {
    await db.delete(schema.clemencyAccomplishments).where(eq(schema.clemencyAccomplishments.familyId, familyA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("creates a preparation lazily, defaulting narrativeStatus to draft", async () => {
    const prep = await clemencyLib.ensureClemencyPreparationForLovedOne(familyA, lovedOneA);
    expect(prep?.narrativeStatus).toBe("draft");
    expect(prep?.narrativeDraftContent).toBeNull();
  });

  it("is idempotent — a second call returns the same preparation", async () => {
    const first = await clemencyLib.ensureClemencyPreparationForLovedOne(familyA, lovedOneA);
    const second = await clemencyLib.ensureClemencyPreparationForLovedOne(familyA, lovedOneA);
    expect(second?.id).toBe(first?.id);
  });

  it("refuses to create a preparation for a loved one that doesn't belong to the caller's family", async () => {
    const prep = await clemencyLib.ensureClemencyPreparationForLovedOne(familyB, lovedOneA);
    expect(prep).toBeNull();
  });

  it("refuses to update narrative content scoped to a different family", async () => {
    await clemencyLib.ensureClemencyPreparationForLovedOne(familyA, lovedOneA);
    const result = await clemencyLib.updateClemencyNarrativeContent(familyB, lovedOneA, "Hijacked");
    expect(result).toBeNull();

    const prep = await clemencyLib.getClemencyPreparationForFamily(familyA, lovedOneA);
    expect(prep?.narrativeFinalContent).toBeNull();
  });

  it("updates narrative content under the correct family", async () => {
    await clemencyLib.ensureClemencyPreparationForLovedOne(familyA, lovedOneA);
    const result = await clemencyLib.updateClemencyNarrativeContent(familyA, lovedOneA, "My story...");
    expect(result).not.toBeNull();

    const prep = await clemencyLib.getClemencyPreparationForFamily(familyA, lovedOneA);
    expect(prep?.narrativeFinalContent).toBe("My story...");
  });

  it("creates and lists accomplishments scoped to the correct family", async () => {
    await clemencyLib.createClemencyAccomplishment(familyA, lovedOneA, { title: "Completed GED" });
    const rows = await clemencyLib.listClemencyAccomplishments(familyA, lovedOneA);
    expect(rows.some((r) => r.title === "Completed GED")).toBe(true);

    const wrongFamily = await clemencyLib.listClemencyAccomplishments(familyB, lovedOneA);
    expect(wrongFamily).toHaveLength(0);
  });

  it("refuses to delete an accomplishment scoped to a different family", async () => {
    const row = await clemencyLib.createClemencyAccomplishment(familyA, lovedOneA, { title: "Job training" });
    const result = await clemencyLib.deleteClemencyAccomplishment(familyB, row.id);
    expect(result).toBeNull();

    const rows = await clemencyLib.listClemencyAccomplishments(familyA, lovedOneA);
    expect(rows.some((r) => r.id === row.id)).toBe(true);
  });
});
