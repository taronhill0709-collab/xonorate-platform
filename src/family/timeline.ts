import { db } from "@/db";
import { timelineEvents, lovedOnes, familyCasePeople, users } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { DateConfidence } from "@/family/loved-ones";

export type TimelineEventInput = {
  title?: string | null;
  eventType: string;
  eventDate?: string | null; // "YYYY-MM-DD" — a date column, not a timestamp; null = unknown date
  dateConfidence?: DateConfidence;
  description: string;
  sourceDocumentId?: string | null;
  relatedPersonId?: string | null;
  notes?: string | null;
};

/**
 * timelineEvents has no familyId column of its own (only lovedOneId) — see
 * db-schema.ts. This check, confirming lovedOneId actually belongs to
 * familyId before inserting, is the only thing standing between a caller
 * and creating an event under a loved one that isn't theirs.
 */
export async function createTimelineEvent(
  familyId: string,
  lovedOneId: string,
  createdByUserId: string,
  input: TimelineEventInput,
) {
  const [lovedOne] = await db
    .select({ id: lovedOnes.id })
    .from(lovedOnes)
    .where(and(eq(lovedOnes.id, lovedOneId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  if (!lovedOne) return null;

  const [row] = await db
    .insert(timelineEvents)
    .values({ lovedOneId, createdByUserId, ...input })
    .returning();
  return row;
}

const timelineEventColumns = {
  id: timelineEvents.id,
  lovedOneId: timelineEvents.lovedOneId,
  title: timelineEvents.title,
  eventType: timelineEvents.eventType,
  eventDate: timelineEvents.eventDate,
  dateConfidence: timelineEvents.dateConfidence,
  description: timelineEvents.description,
  sourceDocumentId: timelineEvents.sourceDocumentId,
  relatedPersonId: timelineEvents.relatedPersonId,
  relatedPersonName: familyCasePeople.name,
  notes: timelineEvents.notes,
  createdByUserId: timelineEvents.createdByUserId,
  createdByName: users.name,
  createdByEmail: users.email,
  origin: timelineEvents.origin,
  createdAt: timelineEvents.createdAt,
  updatedAt: timelineEvents.updatedAt,
};

// Unknown-date events (eventDate null) sort after every dated event —
// nulls last is Postgres's default for ASC, which is exactly what we
// want here, so no special-case ordering expression is needed.
export async function listTimelineEventsForLovedOne(familyId: string, lovedOneId: string) {
  return db
    .select(timelineEventColumns)
    .from(timelineEvents)
    .innerJoin(lovedOnes, eq(timelineEvents.lovedOneId, lovedOnes.id))
    .leftJoin(familyCasePeople, eq(timelineEvents.relatedPersonId, familyCasePeople.id))
    .leftJoin(users, eq(timelineEvents.createdByUserId, users.id))
    .where(and(eq(lovedOnes.familyId, familyId), eq(timelineEvents.lovedOneId, lovedOneId)))
    .orderBy(asc(timelineEvents.eventDate));
}

/** Cross-family guard via the lovedOnes join, same reasoning as createTimelineEvent — an eventId alone is never enough. */
export async function getTimelineEventForFamily(familyId: string, eventId: string) {
  const [row] = await db
    .select(timelineEventColumns)
    .from(timelineEvents)
    .innerJoin(lovedOnes, eq(timelineEvents.lovedOneId, lovedOnes.id))
    .leftJoin(familyCasePeople, eq(timelineEvents.relatedPersonId, familyCasePeople.id))
    .leftJoin(users, eq(timelineEvents.createdByUserId, users.id))
    .where(and(eq(timelineEvents.id, eventId), eq(lovedOnes.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

/** Check-then-act: the family-scoped read above stands in for a join on the mutation itself, since Drizzle's update/delete don't support joins directly. */
export async function updateTimelineEvent(
  familyId: string,
  eventId: string,
  input: Partial<TimelineEventInput>,
) {
  const existing = await getTimelineEventForFamily(familyId, eventId);
  if (!existing) return null;

  const [row] = await db
    .update(timelineEvents)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(timelineEvents.id, eventId))
    .returning({ id: timelineEvents.id });
  return row ?? null;
}

export async function deleteTimelineEvent(familyId: string, eventId: string) {
  const existing = await getTimelineEventForFamily(familyId, eventId);
  if (!existing) return null;

  const [row] = await db
    .delete(timelineEvents)
    .where(eq(timelineEvents.id, eventId))
    .returning({ id: timelineEvents.id });
  return row ?? null;
}
