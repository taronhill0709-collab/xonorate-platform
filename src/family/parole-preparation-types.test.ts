import { describe, expect, it } from "vitest";
import {
  computeDocumentsStatus,
  computeFirst90DaysStatus,
  computeSupportLettersStatus,
  computeSupportNetworkStatus,
  PAROLE_SECTIONS,
  summarizeParolePreparationGaps,
} from "./parole-preparation-types";

describe("summarizeParolePreparationGaps", () => {
  it("buckets every section by its own status", () => {
    const result = summarizeParolePreparationGaps([
      { key: "housing", status: "complete" },
      { key: "employment", status: "complete" },
      { key: "transportation", status: "incomplete" },
      { key: "support_network", status: "not_started" },
    ]);

    expect(result.complete).toEqual(["housing", "employment"]);
    expect(result.incomplete).toEqual(["transportation"]);
    expect(result.notStarted).toEqual(["support_network"]);
  });

  it("has exactly eleven sections, seven freeform and four derived", () => {
    expect(PAROLE_SECTIONS).toHaveLength(11);
    expect(PAROLE_SECTIONS.filter((s) => s.kind === "freeform")).toHaveLength(7);
    expect(PAROLE_SECTIONS.filter((s) => s.kind === "derived")).toHaveLength(4);
  });
});

describe("computeSupportNetworkStatus", () => {
  it("is not_started with no support people on file", () => {
    expect(computeSupportNetworkStatus([])).toBe("not_started");
  });

  it("is incomplete when people are listed but none have a canHelpWith tag", () => {
    expect(computeSupportNetworkStatus([{ canHelpWith: [] }, { canHelpWith: [] }])).toBe("incomplete");
  });

  it("is complete once at least one person has a canHelpWith tag", () => {
    expect(computeSupportNetworkStatus([{ canHelpWith: [] }, { canHelpWith: ["Housing"] }])).toBe("complete");
  });
});

describe("computeDocumentsStatus", () => {
  it("is not_started with zero parole documents", () => {
    expect(computeDocumentsStatus(0)).toBe("not_started");
  });

  it("is complete with at least one parole document, never incomplete", () => {
    expect(computeDocumentsStatus(1)).toBe("complete");
    expect(computeDocumentsStatus(5)).toBe("complete");
  });
});

describe("computeSupportLettersStatus", () => {
  it("is not_started with no parole letters or requests", () => {
    expect(computeSupportLettersStatus([])).toBe("not_started");
  });

  it("is incomplete when letters exist but none are approved", () => {
    expect(computeSupportLettersStatus([{ status: "draft" }, { status: "generated" }])).toBe("incomplete");
  });

  it("is complete once at least one letter is approved", () => {
    expect(computeSupportLettersStatus([{ status: "draft" }, { status: "approved" }])).toBe("complete");
  });
});

describe("computeFirst90DaysStatus", () => {
  it("is not_started when the loved one has no Reentry Plan at all", () => {
    expect(computeFirst90DaysStatus(null)).toBe("not_started");
  });

  it("is not_started when every Reentry Plan category is not_started", () => {
    expect(computeFirst90DaysStatus(["not_started", "not_started"])).toBe("not_started");
  });

  it("is incomplete when some but not all categories have started", () => {
    expect(computeFirst90DaysStatus(["complete", "not_started"])).toBe("incomplete");
    expect(computeFirst90DaysStatus(["complete", "incomplete"])).toBe("incomplete");
  });

  it("is complete only once every category is complete", () => {
    expect(computeFirst90DaysStatus(["complete", "complete"])).toBe("complete");
  });
});
