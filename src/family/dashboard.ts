// Pure date logic backing the family dashboard's "What needs attention" and
// "Upcoming" sections, and the loved-one profile page's upcoming-date
// badge (both need the same "which key dates are still ahead of us"
// computation). Deliberately has no DB import — takes plain data so it can
// be unit-tested without a database, unlike most of src/family/*.ts.

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

export type AttentionItem =
  | {
      kind: "upcoming_date";
      lovedOneId: string;
      lovedOneName: string;
      label: string;
      days: number;
    }
  | { kind: "missing_dates"; lovedOneId: string; lovedOneName: string };

const ATTENTION_WINDOW_DAYS = 90;

/** Upcoming dates within ~90 days, plus a gentle nudge for a loved one with no dates recorded at all. Sorted soonest-first, missing-dates nudges last. */
export function computeAttentionItems(
  lovedOnes: LovedOneKeyDates[],
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

  items.sort((a, b) => {
    if (a.kind === "upcoming_date" && b.kind === "upcoming_date") return a.days - b.days;
    if (a.kind === "upcoming_date") return -1;
    if (b.kind === "upcoming_date") return 1;
    return 0;
  });

  return items;
}

export type UpcomingListItem = {
  lovedOneId: string;
  lovedOneName: string;
  label: string;
  date: Date;
};

/** Every upcoming key date across every loved one in the family, chronological — the dashboard's "Upcoming" list. */
export function computeUpcomingList(
  lovedOnes: LovedOneKeyDates[],
  now: Date = new Date(),
): UpcomingListItem[] {
  const today = startOfDay(now);
  const all: UpcomingListItem[] = [];

  for (const lovedOne of lovedOnes) {
    const name = lovedOne.preferredName || lovedOne.name;
    for (const { label, date } of getUpcomingKeyDates(lovedOne, today)) {
      all.push({ lovedOneId: lovedOne.id, lovedOneName: name, label, date });
    }
  }

  all.sort((a, b) => a.date.getTime() - b.date.getTime());
  return all;
}
