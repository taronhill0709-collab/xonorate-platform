// Real-database test: same cross-family guard pattern as
// calendar.integration.test.ts/loved-ones.integration.test.ts — a
// lovedOneId alone must never be sufficient to read or update a reentry
// plan; it must also belong to the caller's own familyId.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("reentry plan cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let reentryLib: typeof import("./reentry-plan");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    reentryLib = await import("./reentry-plan");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-reentry-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Reentry Test Family A", ownerUserId: ownerA },
        { name: "Reentry Test Family B", ownerUserId: ownerA },
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

  it("creates one category row per REENTRY_PLAN_CATEGORIES entry, all not_started", async () => {
    const plan = await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    expect(plan?.categories).toHaveLength(reentryLib.REENTRY_PLAN_CATEGORIES.length);
    expect(plan?.categories.every((c) => c.status === "not_started")).toBe(true);
  });

  it("is idempotent — a second call returns the same plan instead of duplicating rows", async () => {
    const first = await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    const second = await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    expect(second?.id).toBe(first?.id);
    expect(second?.categories).toHaveLength(reentryLib.REENTRY_PLAN_CATEGORIES.length);
  });

  it("refuses to create a plan for a loved one that doesn't belong to the caller's family", async () => {
    const plan = await reentryLib.ensureReentryPlanForLovedOne(familyB, lovedOneA);
    expect(plan).toBeNull();
  });

  it("returns null when the plan is requested under a different family", async () => {
    await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    const plan = await reentryLib.getReentryPlanForFamily(familyB, lovedOneA);
    expect(plan).toBeNull();
  });

  it("refuses to update a category scoped to a different family", async () => {
    await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    const result = await reentryLib.updateReentryPlanCategory(familyB, lovedOneA, "housing", {
      status: "complete",
      plan30Day: "Hijacked",
    });
    expect(result).toBeNull();

    const plan = await reentryLib.getReentryPlanForFamily(familyA, lovedOneA);
    const housing = plan?.categories.find((c) => c.category === "housing");
    expect(housing?.status).toBe("not_started");
    expect(housing?.plan30Day).toBeNull();
  });

  it("updates a category's status and content under the correct family", async () => {
    await reentryLib.ensureReentryPlanForLovedOne(familyA, lovedOneA);
    const result = await reentryLib.updateReentryPlanCategory(familyA, lovedOneA, "housing", {
      status: "incomplete",
      plan30Day: "Apply for transitional housing",
    });
    expect(result?.category).toBe("housing");

    const plan = await reentryLib.getReentryPlanForFamily(familyA, lovedOneA);
    const housing = plan?.categories.find((c) => c.category === "housing");
    expect(housing?.status).toBe("incomplete");
    expect(housing?.plan30Day).toBe("Apply for transitional housing");
  });
});
