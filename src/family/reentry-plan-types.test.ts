import { describe, expect, it } from "vitest";
import { REENTRY_PLAN_CATEGORIES, summarizeReentryPlanGaps } from "./reentry-plan-types";

describe("summarizeReentryPlanGaps", () => {
  it("buckets every category by its own status", () => {
    const result = summarizeReentryPlanGaps([
      { category: "housing", status: "complete" },
      { category: "employment", status: "complete" },
      { category: "transportation", status: "incomplete" },
      { category: "identification", status: "not_started" },
    ]);

    expect(result.complete).toEqual(["housing", "employment"]);
    expect(result.incomplete).toEqual(["transportation"]);
    expect(result.notStarted).toEqual(["identification"]);
  });

  it("treats a fresh plan (all categories not_started) as fully unstarted", () => {
    const result = summarizeReentryPlanGaps(
      REENTRY_PLAN_CATEGORIES.map((category) => ({ category, status: "not_started" as const })),
    );

    expect(result.notStarted).toHaveLength(REENTRY_PLAN_CATEGORIES.length);
    expect(result.complete).toHaveLength(0);
    expect(result.incomplete).toHaveLength(0);
  });
});
