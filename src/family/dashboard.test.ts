import { describe, expect, it } from "vitest";
import {
  computeAttentionItems,
  computeUpcomingList,
  getUpcomingKeyDates,
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
  it("flags a date within the 90-day window", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", paroleHearingDate: "2026-02-01" })],
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

  it("does not flag a date beyond the 90-day window", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", expectedReleaseDate: "2027-06-01" })],
      NOW,
    );
    expect(items.filter((i) => i.kind === "upcoming_date")).toHaveLength(0);
  });

  it("nudges when a loved one has no dates recorded at all", () => {
    const items = computeAttentionItems([lovedOne({ id: "lo-1" })], NOW);
    expect(items).toContainEqual({
      kind: "missing_dates",
      lovedOneId: "lo-1",
      lovedOneName: "James Carter",
    });
  });

  it("does not nudge for missing dates once at least one date is recorded", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", arrestDate: "2018-01-01" })],
      NOW,
    );
    expect(items.filter((i) => i.kind === "missing_dates")).toHaveLength(0);
  });

  it("prefers preferredName over name when both are set", () => {
    const items = computeAttentionItems(
      [lovedOne({ id: "lo-1", name: "James Carter", preferredName: "Jimmy" })],
      NOW,
    );
    expect(items[0].lovedOneName).toBe("Jimmy");
  });

  it("sorts upcoming-date items before missing-dates nudges", () => {
    const items = computeAttentionItems(
      [
        lovedOne({ id: "lo-missing" }),
        lovedOne({ id: "lo-upcoming", paroleHearingDate: "2026-01-15" }),
      ],
      NOW,
    );
    expect(items[0]).toMatchObject({ kind: "upcoming_date", lovedOneId: "lo-upcoming" });
    expect(items[1]).toMatchObject({ kind: "missing_dates", lovedOneId: "lo-missing" });
  });
});

describe("computeUpcomingList", () => {
  it("merges and sorts dates across multiple loved ones", () => {
    const list = computeUpcomingList(
      [
        lovedOne({ id: "lo-1", name: "James", paroleHearingDate: "2026-05-01" }),
        lovedOne({ id: "lo-2", name: "Maria", expectedReleaseDate: "2026-02-01" }),
      ],
      NOW,
    );
    expect(list.map((i) => i.lovedOneName)).toEqual(["Maria", "James"]);
  });

  it("returns an empty list when no loved one has any upcoming dates", () => {
    const list = computeUpcomingList([lovedOne()], NOW);
    expect(list).toHaveLength(0);
  });
});
