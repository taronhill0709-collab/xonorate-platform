// Split out from calendar.ts on purpose: this file must stay safe to import
// from a "use client" component. calendar.ts imports `db` (which pulls in
// `pg`, a Node-only package) at module scope, so any import from it —
// even just a type or label constant — drags that into the client bundle
// and breaks the build. @/db/schema itself has no such import (it's pure
// drizzle-orm table/enum definitions), so it's safe to use here.
import { familyCalendarEventTypeEnum } from "@/db/schema";

export type CalendarEventType = (typeof familyCalendarEventTypeEnum.enumValues)[number];

/** Human-language labels for the UI — never show the raw db enum value to a user. */
export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  visit: "Visit",
  court: "Court",
  parole: "Parole",
  clemency: "Clemency",
  release: "Release",
  deposit: "Deposit",
  call: "Call",
  letter: "Letter",
  attorney_meeting: "Attorney meeting",
  application_deadline: "Application deadline",
  family_event: "Family event",
  custom: "Custom",
  hearing: "Hearing",
  appeal_deadline: "Appeal deadline",
  filing_deadline: "Filing deadline",
};
