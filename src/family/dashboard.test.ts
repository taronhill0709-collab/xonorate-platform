import { describe, expect, it } from "vitest";
import {
  computeAttentionItems,
  computeUpcomingList,
  getUpcomingKeyDates,
  type CalendarEventLike,
  type LovedOneKeyDates,
} from "./dashboard";

const NOW = new Date("2026-01-01T00:00:00Z");

function lovedOne(overrides: Partial<LovedOneKeyDates> = {}): LovedOneKeyDates {
  return {
    id: "lo-1",
    name: "James Carter",
    preferredName: null,
    arrestDate: null,
    convictionDate: null,
    paroleEligibilityDate: null,
    paroleHearingDate: null,
    expectedReleaseDate: null,
    ...overrides,
  };
}

function calendarEvent(overrides: Partial<CalendarEventLike> = {}): CalendarEventLike {
  return {
    id: "event-1",
    lovedOneId: "lo-1",
    lovedOneName: "James Carter",
    title: "Visit",
    eventDate: "2026-01-02T14:00:00Z",
    ...overrides,
  };
}

describe("getUpcomingKeyDates", () => {
  it("excludes past dates", () => {
    const result = getUpcomingKeyDates(
      lovedOne({ paroleHearingDate: "2025-01-01" }),
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it("excludes historical fields (arrest/conviction) even if in the future", () => {
    const result = getUpcomingKeyDates(
      lovedOne({ arrestDate: "2026-06-01", convictionDate: "2026-06-01" }),
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it("sorts multiple upcoming dates soonest-first", () => {
    const result = getUpcomingKeyDates(
      lovedOne({
        expectedReleaseDate: "2027-01-01",
        paroleHearingDate: "2026-03-01",
        paroleEligibilityDate: "2026-02-01",
      }),
      NOW,
    );
    expect(result.map((r) => r.label)).toEqual([
      "Parole eligibility",
      "Parole hearing",
      "Expected release",
    ]);
  });

  it("includes a date that falls exactly on today", () => {
    const result = getUpcomingKeyDates(
      lovedOne({ paroleHearingDate: "2026-01-01" }),
      NOW,
    );
    expect(result).toHaveLength(1);
  });
});

describe("computeAttentionItems", () => {
  it("flags a key date within the 90-day window", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", paroleHearingDate: "2026-02-01" })],
      [],
      NOW,
    );
    expect(items).toContainEqual({
      kind: "upcoming_date",
      lovedOneId: "lo-1",
      lovedOneName: "James Carter",
      label: "Parole hearing",
      days: 31,
    });
  });

  it("does not flag a key date beyond the 90-day window", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", expectedReleaseDate: "2027-06-01" })],
      [],
      NOW,
    );
    expect(items.filter((i) => i.kind === "upcoming_date")).toHaveLength(0);
  });

  it("nudges when a loved one has no dates recorded at all", () => {
    const items = computeAttentionItems([lovedOne({ id: "lo-1" })], [], NOW);
    expect(items).toContainEqual({
      kind: "missing_dates",
      lovedOneId: "lo-1",
      lovedOneName: "James Carter",
    });
  });

  it("does not nudge for missing dates once at least one date is recorded", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", arrestDate: "2018-01-01" })],
      [],
      NOW,
    );
    expect(items.filter((i) => i.kind === "missing_dates")).toHaveLength(0);
  });

  it("prefers preferredName over name when both are set", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", name: "James Carter", preferredName: "Jimmy" })],
      [],
      NOW,
    );
    expect(items[0].lovedOneName).toBe("Jimmy");
  });

  it("sorts items soonest-first, missing-dates nudges last", () => {
    const items = computeAttentionItems(
      [
        lovedOne({ id: "lo-missing" }),
        lovedOne({ id: "lo-upcoming", paroleHearingDate: "2026-01-15" }),
      ],
      [],
      NOW,
    );
    expect(items[0]).toMatchObject({ kind: "upcoming_date", lovedOneId: "lo-upcoming" });
    expect(items[1]).toMatchObject({ kind: "missing_dates", lovedOneId: "lo-missing" });
  });

  it("flags a calendar event within the 7-day window", () => {
    const items = computeAttentionItems(
      [],
      [calendarEvent({ eventDate: "2026-01-02T14:00:00Z" })],
      NOW,
    );
    expect(items).toContainEqual({
      kind: "calendar_event_soon",
      eventId: "event-1",
      lovedOneId: "lo-1",
      lovedOneName: "James Carter",
      title: "Visit",
      days: 2,
    });
  });

  it("does not flag a calendar event beyond the 7-day window, even though it would qualify for the 90-day key-date window", () => {
    const items = computeAttentionItems(
      [],
      [calendarEvent({ eventDate: "2026-01-20T14:00:00Z" })],
      NOW,
    );
    expect(items.filter((i) => i.kind === "calendar_event_soon")).toHaveLength(0);
  });

  it("does not flag a past calendar event", () => {
    const items = computeAttentionItems(
      [],
      [calendarEvent({ eventDate: "2025-12-01T14:00:00Z" })],
      NOW,
    );
    expect(items.filter((i) => i.kind === "calendar_event_soon")).toHaveLength(0);
  });

  it("includes a calendar event with no loved one attached", () => {
    const items = computeAttentionItems(
      [],
      [calendarEvent({ lovedOneId: null, lovedOneName: null, title: "Family gathering" })],
      NOW,
    );
    expect(items).toContainEqual(
      expect.objectContaining({ kind: "calendar_event_soon", lovedOneId: null }),
    );
  });
});

describe("computeUpcomingList", () => {
  it("merges and sorts key dates across multiple loved ones", () => {
    const list = computeUpcomingList(
      [
        lovedOne({ id: "lo-1", name: "James", paroleHearingDate: "2026-05-01" }),
        lovedOne({ id: "lo-2", name: "Maria", expectedReleaseDate: "2026-02-01" }),
      ],
      [],
      NOW,
    );
    expect(list.map((i) => i.lovedOneName)).toEqual(["Maria", "James"]);
  });

  it("returns an empty list when nothing is upcoming", () => {
    const list = computeUpcomingList([lovedOne()], [], NOW);
    expect(list).toHaveLength(0);
  });

  it("merges calendar events with key dates in chronological order", () => {
    const list = computeUpcomingList(
      [lovedOne({ id: "lo-1", name: "James", expectedReleaseDate: "2026-06-01" })],
      [calendarEvent({ eventDate: "2026-01-05T14:00:00Z" })],
      NOW,
    );
    expect(list.map((i) => i.source)).toEqual(["calendar_event", "key_date"]);
  });

  it("excludes a past calendar event", () => {
    const list = computeUpcomingList(
      [],
      [calendarEvent({ eventDate: "2025-12-01T14:00:00Z" })],
      NOW,
    );
    expect(list).toHaveLength(0);
  });

  it("includes a calendar event scheduled earlier today", () => {
    const list = computeUpcomingList(
      [],
      [calendarEvent({ eventDate: "2026-01-01T01:00:00Z" })],
      new Date("2026-01-01T12:00:00Z"),
    );
    expect(list).toHaveLength(1);
  });
});
