// Real-database test: same cross-family guard pattern as
// loved-ones.integration.test.ts — an eventId alone must never be
// sufficient to read, update, or delete a calendar event; it must also
// belong to the caller's own familyId.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("calendar event cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let calendarLib: typeof import("./calendar");

  let familyA: string, familyB: string, eventA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    calendarLib = await import("./calendar");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-cal-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Cal Test Family A", ownerUserId: ownerA },
        { name: "Cal Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const event = await calendarLib.createCalendarEvent(familyA, {
      type: "visit",
      title: "Test Visit",
      eventDate: new Date("2030-01-01T14:00:00Z"),
    });
    eventA = event.id;
  });

  afterAll(async () => {
    await db.delete(schema.familyCalendarEvents).where(eq(schema.familyCalendarEvents.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("finds the event under its own family", async () => {
    const row = await calendarLib.getCalendarEventForFamily(familyA, eventA);
    expect(row?.id).toBe(eventA);
  });

  it("returns null when the event is requested under a different family", async () => {
    const row = await calendarLib.getCalendarEventForFamily(familyB, eventA);
    expect(row).toBeNull();
  });

  it("refuses to update an event scoped to a different family", async () => {
    const result = await calendarLib.updateCalendarEvent(familyB, eventA, {
      title: "Hijacked Title",
    });
    expect(result).toBeNull();

    const unchanged = await calendarLib.getCalendarEventForFamily(familyA, eventA);
    expect(unchanged?.title).toBe("Test Visit");
  });

  it("refuses to delete an event scoped to a different family", async () => {
    const result = await calendarLib.deleteCalendarEvent(familyB, eventA);
    expect(result).toBeNull();

    const stillThere = await calendarLib.getCalendarEventForFamily(familyA, eventA);
    expect(stillThere).not.toBeNull();
  });
});
