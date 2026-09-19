// Real-database test: same cross-family guard pattern as
// reentry-plan.integration.test.ts — a lovedOneId alone must never be
// sufficient to read or update a parole preparation; it must also belong
// to the caller's own familyId.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("parole preparation cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let paroleLib: typeof import("./parole-preparation");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    paroleLib = await import("./parole-preparation");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-parole-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Parole Test Family A", ownerUserId: ownerA },
        { name: "Parole Test Family B", ownerUserId: ownerA },
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

  it("creates one freeform section row per PAROLE_FREEFORM_SECTIONS entry, all not_started", async () => {
    const prep = await paroleLib.ensureParolePreparationForLovedOne(familyA, lovedOneA);
    expect(prep?.sections).toHaveLength(7);
    expect(prep?.sections.every((s) => s.status === "not_started")).toBe(true);
  });

  it("is idempotent — a second call returns the same preparation instead of duplicating rows", async () => {
    const first = await paroleLib.ensureParolePreparationForLovedOne(familyA, lovedOneA);
    const second = await paroleLib.ensureParolePreparationForLovedOne(familyA, lovedOneA);
    expect(second?.id).toBe(first?.id);
    expect(second?.sections).toHaveLength(7);
  });

  it("refuses to create a preparation for a loved one that doesn't belong to the caller's family", async () => {
    const prep = await paroleLib.ensureParolePreparationForLovedOne(familyB, lovedOneA);
    expect(prep).toBeNull();
  });

  it("refuses to update a section scoped to a different family", async () => {
    await paroleLib.ensureParolePreparationForLovedOne(familyA, lovedOneA);
    const result = await paroleLib.updateParolePreparationSection(familyB, lovedOneA, "housing", {
      status: "complete",
      notes: "Hijacked",
    });
    expect(result).toBeNull();

    const prep = await paroleLib.getParolePreparationSections(familyA, lovedOneA);
    const housing = prep?.sections.find((s) => s.section === "housing");
    expect(housing?.status).toBe("not_started");
    expect(housing?.notes).toBeNull();
  });

  it("updates a section's status and notes under the correct family", async () => {
    await paroleLib.ensureParolePreparationForLovedOne(familyA, lovedOneA);
    const result = await paroleLib.updateParolePreparationSection(familyA, lovedOneA, "housing", {
      status: "incomplete",
      notes: "Looking into transitional housing",
    });
    expect(result?.section).toBe("housing");

    const prep = await paroleLib.getParolePreparationSections(familyA, lovedOneA);
    const housing = prep?.sections.find((s) => s.section === "housing");
    expect(housing?.status).toBe("incomplete");
    expect(housing?.notes).toBe("Looking into transitional housing");
  });

  it("computes the full eleven-section overview with derived sections not_started when nothing else exists yet", async () => {
    const overview = await paroleLib.getParolePreparationOverview(familyA, lovedOneA);
    expect(overview?.sections).toHaveLength(11);
    const supportNetwork = overview?.sections.find((s) => s.key === "support_network");
    const documents = overview?.sections.find((s) => s.key === "documents");
    const supportLetters = overview?.sections.find((s) => s.key === "support_letters");
    const first90Days = overview?.sections.find((s) => s.key === "first_90_days");
    expect(supportNetwork?.status).toBe("not_started");
    expect(documents?.status).toBe("not_started");
    expect(supportLetters?.status).toBe("not_started");
    expect(first90Days?.status).toBe("not_started");
  });
});
