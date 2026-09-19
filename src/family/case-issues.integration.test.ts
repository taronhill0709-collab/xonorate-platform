// Real-database test: same cross-family guard pattern as every other
// family-scoped table.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("case issues cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let caseIssuesLib: typeof import("./case-issues");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    caseIssuesLib = await import("./case-issues");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-case-issues-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Case Issues Test Family A", ownerUserId: ownerA },
        { name: "Case Issues Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const lovedOne = await lovedOnesLib.createLovedOne(familyA, { name: "Test Loved One" });
    lovedOneA = lovedOne.id;
  });

  afterAll(async () => {
    await db.delete(schema.familyCaseIssues).where(eq(schema.familyCaseIssues.familyId, familyA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("creates an issue defaulting to open/medium", async () => {
    const issue = await caseIssuesLib.createCaseIssue(familyA, lovedOneA, ownerA, {
      title: "Why do these two documents show different dates?",
    });
    expect(issue.status).toBe("open");
    expect(issue.priority).toBe("medium");
  });

  it("lists issues scoped to the correct family only", async () => {
    const rows = await caseIssuesLib.listCaseIssuesForLovedOne(familyA, lovedOneA);
    expect(rows.length).toBeGreaterThan(0);

    const wrongFamily = await caseIssuesLib.listCaseIssuesForLovedOne(familyB, lovedOneA);
    expect(wrongFamily).toHaveLength(0);
  });

  it("refuses to update or resolve an issue scoped to a different family", async () => {
    const issue = await caseIssuesLib.createCaseIssue(familyA, lovedOneA, ownerA, {
      title: "Need clarification about this filing date",
    });

    const result = await caseIssuesLib.updateCaseIssue(familyB, issue.id, {
      status: "resolved",
      resolutionNotes: "Hijacked",
    });
    expect(result).toBeNull();

    const stillOpen = await caseIssuesLib.getCaseIssueForFamily(familyA, issue.id);
    expect(stillOpen?.status).toBe("open");
    expect(stillOpen?.resolutionNotes).toBeNull();
  });

  it("resolves an issue under the correct family", async () => {
    const issue = await caseIssuesLib.createCaseIssue(familyA, lovedOneA, ownerA, {
      title: "Ask attorney whether this motion was ever ruled on",
    });

    const result = await caseIssuesLib.updateCaseIssue(familyA, issue.id, {
      status: "resolved",
      resolutionNotes: "Attorney confirmed it was denied on appeal.",
    });
    expect(result).not.toBeNull();

    const resolved = await caseIssuesLib.getCaseIssueForFamily(familyA, issue.id);
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolutionNotes).toBe("Attorney confirmed it was denied on appeal.");
  });

  it("refuses to delete an issue scoped to a different family", async () => {
    const issue = await caseIssuesLib.createCaseIssue(familyA, lovedOneA, ownerA, { title: "Delete-test issue" });
    const result = await caseIssuesLib.deleteCaseIssue(familyB, issue.id);
    expect(result).toBeNull();

    const stillThere = await caseIssuesLib.getCaseIssueForFamily(familyA, issue.id);
    expect(stillThere).not.toBeNull();
  });
});
