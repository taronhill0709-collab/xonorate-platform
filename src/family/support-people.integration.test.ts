// Real-database test: same cross-family guard pattern as
// loved-ones/calendar/documents/notes — a personId alone must never be
// sufficient to read, update, or delete a support person; it must also
// belong to the caller's own familyId.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("support person cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let supportLib: typeof import("./support-people");

  let familyA: string, familyB: string, personA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    supportLib = await import("./support-people");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-support-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Support Test Family A", ownerUserId: ownerA },
        { name: "Support Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const person = await supportLib.createSupportPerson(familyA, {
      name: "Aunt Lisa",
      relationship: "Aunt",
      canHelpWith: ["Housing"],
    });
    personA = person.id;
  });

  afterAll(async () => {
    await db.delete(schema.supportPeople).where(eq(schema.supportPeople.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("finds the person under its own family", async () => {
    const row = await supportLib.getSupportPersonForFamily(familyA, personA);
    expect(row?.id).toBe(personA);
  });

  it("returns null when the person is requested under a different family", async () => {
    const row = await supportLib.getSupportPersonForFamily(familyB, personA);
    expect(row).toBeNull();
  });

  it("refuses to update a person scoped to a different family", async () => {
    const result = await supportLib.updateSupportPerson(familyB, personA, {
      name: "Hijacked Name",
    });
    expect(result).toBeNull();

    const unchanged = await supportLib.getSupportPersonForFamily(familyA, personA);
    expect(unchanged?.name).toBe("Aunt Lisa");
  });

  it("refuses to delete a person scoped to a different family", async () => {
    const result = await supportLib.deleteSupportPerson(familyB, personA);
    expect(result).toBeNull();

    const stillThere = await supportLib.getSupportPersonForFamily(familyA, personA);
    expect(stillThere).not.toBeNull();
  });

  it("scopes listSupportPeopleForFamily to the given family", async () => {
    const familyAResults = await supportLib.listSupportPeopleForFamily(familyA);
    expect(familyAResults.map((p) => p.id)).toContain(personA);

    const familyBResults = await supportLib.listSupportPeopleForFamily(familyB);
    expect(familyBResults.map((p) => p.id)).not.toContain(personA);
  });
});
