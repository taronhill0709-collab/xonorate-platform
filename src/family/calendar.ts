import { db } from "@/db";
import { familyCalendarEvents, lovedOnes } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { CalendarEventType } from "@/family/calendar-types";

// Re-exported for server-side callers (list/edit pages) that already need
// the DB functions from this file — client components must import these
// from @/family/calendar-types directly instead, never from here. See that
// file's header comment for why.
export { CALENDAR_EVENT_TYPE_LABELS, type CalendarEventType } from "@/family/calendar-types";

export type CalendarEventInput = {
  lovedOneId?: string | null;
  type: CalendarEventType;
  title: string;
  eventDate: Date;
  notes?: string | null;
};

export async function createCalendarEvent(familyId: string, input: CalendarEventInput) {
  const [row] = await db
    .insert(familyCalendarEvents)
    .values({ familyId, ...input })
    .returning();
  return row;
}

/** Chronological, all events (past and future) — the calendar page shows history too, unlike the dashboard's "Upcoming" section which filters to future-only. */
export async function listCalendarEventsForFamily(familyId: string) {
  return db
    .select({
      id: familyCalendarEvents.id,
      lovedOneId: familyCalendarEvents.lovedOneId,
      lovedOneName: lovedOnes.name,
      type: familyCalendarEvents.type,
      title: familyCalendarEvents.title,
      eventDate: familyCalendarEvents.eventDate,
      notes: familyCalendarEvents.notes,
    })
    .from(familyCalendarEvents)
    .leftJoin(lovedOnes, eq(familyCalendarEvents.lovedOneId, lovedOnes.id))
    .where(eq(familyCalendarEvents.familyId, familyId))
    .orderBy(asc(familyCalendarEvents.eventDate));
}

/** Same cross-family guard as loved-ones.ts: scopes on both eventId and familyId, never trusting a client-supplied eventId alone. */
export async function getCalendarEventForFamily(familyId: string, eventId: string) {
  const [row] = await db
    .select()
    .from(familyCalendarEvents)
    .where(
      and(eq(familyCalendarEvents.id, eventId), eq(familyCalendarEvents.familyId, familyId)),
    )
    .limit(1);
  return row ?? null;
}

export async function updateCalendarEvent(
  familyId: string,
  eventId: string,
  input: Partial<CalendarEventInput>,
) {
  const [row] = await db
    .update(familyCalendarEvents)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(eq(familyCalendarEvents.id, eventId), eq(familyCalendarEvents.familyId, familyId)),
    )
    .returning({ id: familyCalendarEvents.id });
  return row ?? null;
}

export async function deleteCalendarEvent(familyId: string, eventId: string) {
  const [row] = await db
    .delete(familyCalendarEvents)
    .where(
      and(eq(familyCalendarEvents.id, eventId), eq(familyCalendarEvents.familyId, familyId)),
    )
    .returning({ id: familyCalendarEvents.id });
  return row ?? null;
}
