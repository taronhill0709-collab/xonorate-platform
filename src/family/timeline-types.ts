// Client-safe: `DateConfidence` is a type-only import (erased at compile
// time), so this never drags loved-ones.ts's `db` import into a client
// bundle — see docs/ARCHITECTURE.md's "Keep client-safe constants out of
// DB-touching files" note, and edit-loved-one-form.tsx for the same
// import-type-only pattern already in use.
import type { DateConfidence } from "@/family/loved-ones";

export const SUGGESTED_TIMELINE_EVENT_TYPES = [
  "Arrest",
  "Trial",
  "Conviction",
  "Sentencing",
  "Appeal",
  "Parole hearing",
  "Release",
  "Milestone",
];

/** The short label a timeline entry displays — the family's own title if they gave one, falling back to the event type so pre-Case-Organizer rows (title is nullable) still render sensibly. */
export function getTimelineEventLabel(event: { title: string | null; eventType: string }): string {
  return event.title || event.eventType.replace(/_/g, " ");
}

/** "date unknown"/"date not confirmed" read naturally in a sentence; a plain date does too. Never renders a raw null. */
export function formatTimelineEventDate(
  eventDate: string | null,
  dateConfidence: DateConfidence,
): string {
  if (!eventDate) return "Date unknown";
  const formatted = new Date(eventDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return dateConfidence === "approximate" ? `${formatted} (approximate)` : formatted;
}
