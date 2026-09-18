// Pure date logic backing the family dashboard's "What needs attention" and
// "Upcoming" sections, and the loved-one profile page's upcoming-date
// badge. Deliberately has no DB import — takes plain data (loved-one key
// dates and, since Calendar shipped, calendar events) so it can be
// unit-tested without a database, unlike most of src/family/*.ts.

export type LovedOneKeyDates = {
  id: string;
  name: string;
  preferredName: string | null;
  arrestDate: string | null;
  convictionDate: string | null;
  paroleEligibilityDate: string | null;
  paroleHearingDate: string | null;
  expectedReleaseDate: string | null;
};

export type CalendarEventLike = {
  id: string;
  lovedOneId: string | null;
  lovedOneName: string | null;
  title: string;
  eventDate: Date | string;
};

const UPCOMING_DATE_FIELDS = [
  { key: "paroleHearingDate", label: "Parole hearing" },
  { key: "paroleEligibilityDate", label: "Parole eligibility" },
  { key: "expectedReleaseDate", label: "Expected release" },
] as const satisfies readonly { key: keyof LovedOneKeyDates; label: string }[];

// UTC, not local time: a "date"-typed Postgres column (e.g. "2026-02-01")
// parses in JS as UTC midnight, so "today" must be floored the same way —
// otherwise the day-count would be off by one depending on the server's
// local timezone relative to UTC.
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Every forward-looking key date on a loved one that hasn't passed yet, nearest first. Arrest/conviction are historical, not "upcoming," so they're excluded. */
export function getUpcomingKeyDates(
  lovedOne: LovedOneKeyDates,
  now: Date = new Date(),
): { label: string; date: Date }[] {
  const today = startOfDay(now);
  const results: { label: string; date: Date }[] = [];

  for (const { key, label } of UPCOMING_DATE_FIELDS) {
    const raw = lovedOne[key];
    if (!raw) continue;
    const date = new Date(raw);
    if (date < today) continue;
    results.push({ label, date });
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime());
  return results;
}

/** Calendar events that haven't happened yet, nearest first. Unlike key dates, calendar events carry a specific time, not just a day — so "today" here compares full timestamps, not just the date. */
function getUpcomingCalendarEvents(
  events: CalendarEventLike[],
  now: Date,
): (CalendarEventLike & { date: Date })[] {
  return events
    .map((e) => ({ ...e, date: new Date(e.eventDate) }))
    .filter((e) => e.date.getTime() >= now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type AttentionItem =
  | {
      kind: "upcoming_date";
      lovedOneId: string;
      lovedOneName: string;
      label: string;
      days: number;
    }
  | { kind: "missing_dates"; lovedOneId: string; lovedOneName: string }
  | {
      kind: "calendar_event_soon";
      eventId: string;
      lovedOneId: string | null;
      lovedOneName: string | null;
      title: string;
      days: number;
    };

// Key dates (parole hearings, release) are long-horizon milestones worth
// surfacing months out. Calendar events (visits, deposits, calls) are
// short-term action items — flagging one 90 days out would just be clutter,
// so it gets a much tighter window.
const ATTENTION_WINDOW_DAYS = 90;
const CALENDAR_ATTENTION_WINDOW_DAYS = 7;

/** Upcoming key dates within ~90 days, calendar events within ~7 days, plus a nudge for a loved one with no dates recorded at all. Sorted soonest-first by day count; missing-dates nudges last. */
export function computeAttentionItems(
  lovedOnes: LovedOneKeyDates[],
  calendarEvents: CalendarEventLike[] = [],
  now: Date = new Date(),
): AttentionItem[] {
  const today = startOfDay(now);
  const items: AttentionItem[] = [];

  for (const lovedOne of lovedOnes) {
    const name = lovedOne.preferredName || lovedOne.name;

    for (const { label, date } of getUpcomingKeyDates(lovedOne, today)) {
      const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
      if (days <= ATTENTION_WINDOW_DAYS) {
        items.push({ kind: "upcoming_date", lovedOneId: lovedOne.id, lovedOneName: name, label, days });
      }
    }

    const hasNoDatesAtAll = [
      lovedOne.arrestDate,
      lovedOne.convictionDate,
      lovedOne.paroleEligibilityDate,
      lovedOne.paroleHearingDate,
      lovedOne.expectedReleaseDate,
    ].every((d) => !d);
    if (hasNoDatesAtAll) {
      items.push({ kind: "missing_dates", lovedOneId: lovedOne.id, lovedOneName: name });
    }
  }

  for (const event of getUpcomingCalendarEvents(calendarEvents, today)) {
    const days = Math.round((event.date.getTime() - today.getTime()) / 86_400_000);
    if (days <= CALENDAR_ATTENTION_WINDOW_DAYS) {
      items.push({
        kind: "calendar_event_soon",
        eventId: event.id,
        lovedOneId: event.lovedOneId,
        lovedOneName: event.lovedOneName,
        title: event.title,
        days,
      });
    }
  }

  items.sort((a, b) => {
    const aDays = a.kind === "missing_dates" ? Infinity : a.days;
    const bDays = b.kind === "missing_dates" ? Infinity : b.days;
    return aDays - bDays;
  });

  return items;
}

export type UpcomingListItem =
  | {
      source: "key_date";
      lovedOneId: string;
      lovedOneName: string;
      label: string;
      date: Date;
    }
  | {
      source: "calendar_event";
      eventId: string;
      lovedOneId: string | null;
      lovedOneName: string | null;
      label: string;
      date: Date;
    };

/** Every upcoming key date and calendar event across the family, merged and sorted chronologically — the dashboard's "Upcoming" list. */
export function computeUpcomingList(
  lovedOnes: LovedOneKeyDates[],
  calendarEvents: CalendarEventLike[] = [],
  now: Date = new Date(),
): UpcomingListItem[] {
  const today = startOfDay(now);
  const all: UpcomingListItem[] = [];

  for (const lovedOne of lovedOnes) {
    const name = lovedOne.preferredName || lovedOne.name;
    for (const { label, date } of getUpcomingKeyDates(lovedOne, today)) {
      all.push({ source: "key_date", lovedOneId: lovedOne.id, lovedOneName: name, label, date });
    }
  }

  for (const event of getUpcomingCalendarEvents(calendarEvents, today)) {
    all.push({
      source: "calendar_event",
      eventId: event.id,
      lovedOneId: event.lovedOneId,
      lovedOneName: event.lovedOneName,
      label: event.title,
      date: event.date,
    });
  }

  all.sort((a, b) => a.date.getTime() - b.date.getTime());
  return all;
}
