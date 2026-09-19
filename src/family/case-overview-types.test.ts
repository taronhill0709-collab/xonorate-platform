import { describe, expect, it } from "vitest";
import { computeCaseCompleteness, hasAnyMissingInfo } from "./case-overview-types";

const FULL_INPUT = {
  caseNumber: "2015-CR-001",
  court: "County Circuit Court",
  jurisdiction: "State",
  stage: "sentenced" as const,
  sentenceLength: "15 years",
  hasFacility: true,
  hasAttorney: true,
  documentCount: 3,
  timelineEventCount: 5,
  casePeopleCount: 2,
};

describe("computeCaseCompleteness", () => {
  it("marks every item present when everything is filled in", () => {
    const groups = computeCaseCompleteness(FULL_INPUT);
    expect(hasAnyMissingInfo(groups)).toBe(false);
  });

  it("never produces a score — every group is a labeled present/missing list, not a number", () => {
    const groups = computeCaseCompleteness(FULL_INPUT);
    for (const group of groups) {
      expect(typeof group.title).toBe("string");
      for (const item of group.items) {
        expect(typeof item.label).toBe("string");
        expect(typeof item.present).toBe("boolean");
      }
    }
  });

  it("marks stage missing only when it's literally 'unknown'", () => {
    const withStage = computeCaseCompleteness({ ...FULL_INPUT, stage: "trial" });
    const stageItem = withStage[0].items.find((i) => i.label === "Current stage");
    expect(stageItem?.present).toBe(true);

    const withoutStage = computeCaseCompleteness({ ...FULL_INPUT, stage: "unknown" });
    const missingStageItem = withoutStage[0].items.find((i) => i.label === "Current stage");
    expect(missingStageItem?.present).toBe(false);
  });

  it("flags missing documents, people, and timeline independently", () => {
    const groups = computeCaseCompleteness({
      ...FULL_INPUT,
      documentCount: 0,
      timelineEventCount: 0,
      casePeopleCount: 0,
    });
    expect(hasAnyMissingInfo(groups)).toBe(true);
    const documentsGroup = groups.find((g) => g.title === "Documents");
    const peopleGroup = groups.find((g) => g.title === "People");
    const timelineGroup = groups.find((g) => g.title === "Timeline");
    expect(documentsGroup?.items.every((i) => !i.present)).toBe(true);
    expect(peopleGroup?.items.every((i) => !i.present)).toBe(true);
    expect(timelineGroup?.items.every((i) => !i.present)).toBe(true);
  });

  it("reports missing when a case has nothing filled in at all", () => {
    const groups = computeCaseCompleteness({
      caseNumber: null,
      court: null,
      jurisdiction: null,
      stage: "unknown",
      sentenceLength: null,
      hasFacility: false,
      hasAttorney: false,
      documentCount: 0,
      timelineEventCount: 0,
      casePeopleCount: 0,
    });
    expect(hasAnyMissingInfo(groups)).toBe(true);
    expect(groups.every((g) => g.items.every((i) => !i.present))).toBe(true);
  });
});
