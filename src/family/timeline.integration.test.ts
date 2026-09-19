// Real-database test: timelineEvents has no familyId column of its own
// (only lovedOneId — see db-schema.ts), so every function here must
// prove it actually enforces family scoping through the lovedOnes join
// rather than trusting a client-supplied lovedOneId/eventId alone.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("timeline event cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lovedOnesLib: typeof import("./loved-ones");
  let timelineLib: typeof import("./timeline");

  let familyA: string, familyB: string, lovedOneA: string, ownerA: string, eventA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lovedOnesLib = await import("./loved-ones");
    timelineLib = await import("./timeline");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-timeline-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Timeline Test Family A", ownerUserId: ownerA },
        { name: "Timeline Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const lovedOne = await lovedOnesLib.createLovedOne(familyA, { name: "Test Loved One" });
    lovedOneA = lovedOne.id;

    const event = await timelineLib.createTimelineEvent(familyA, lovedOneA, {
      eventType: "Sentencing",
      eventDate: "2020-01-15",
      description: "Sentenced to 5 years.",
    });
    eventA = event!.id;
  });

  afterAll(async () => {
    await db.delete(schema.timelineEvents).where(eq(schema.timelineEvents.lovedOneId, lovedOneA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("refuses to create an event for a loved one that doesn't belong to the caller's family", async () => {
    const event = await timelineLib.createTimelineEvent(familyB, lovedOneA, {
      eventType: "Hijacked",
      eventDate: "2020-01-01",
      description: "Should not be created.",
    });
    expect(event).toBeNull();
  });

  it("finds the event under its own family", async () => {
    const row = await timelineLib.getTimelineEventForFamily(familyA, eventA);
    expect(row?.id).toBe(eventA);
  });

  it("returns null when the event is requested under a different family", async () => {
    const row = await timelineLib.getTimelineEventForFamily(familyB, eventA);
    expect(row).toBeNull();
  });

  it("refuses to update an event scoped to a different family", async () => {
    const result = await timelineLib.updateTimelineEvent(familyB, eventA, {
      description: "Hijacked description",
    });
    expect(result).toBeNull();

    const unchanged = await timelineLib.getTimelineEventForFamily(familyA, eventA);
    expect(unchanged?.description).toBe("Sentenced to 5 years.");
  });

  it("refuses to delete an event scoped to a different family", async () => {
    const result = await timelineLib.deleteTimelineEvent(familyB, eventA);
    expect(result).toBeNull();

    const stillThere = await timelineLib.getTimelineEventForFamily(familyA, eventA);
    expect(stillThere).not.toBeNull();
  });

  it("lists events for the correct family/loved-one pair only", async () => {
    const rows = await timelineLib.listTimelineEventsForLovedOne(familyA, lovedOneA);
    expect(rows.map((r) => r.id)).toContain(eventA);

    const wrongFamily = await timelineLib.listTimelineEventsForLovedOne(familyB, lovedOneA);
    expect(wrongFamily).toHaveLength(0);
  });
});
