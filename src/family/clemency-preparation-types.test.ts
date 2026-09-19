import { describe, expect, it } from "vitest";
import { getNarrativeContent } from "./clemency-preparation-types";

describe("getNarrativeContent", () => {
  it("prefers narrativeFinalContent over narrativeDraftContent when both exist", () => {
    expect(
      getNarrativeContent({ narrativeDraftContent: "draft", narrativeFinalContent: "edited" }),
    ).toBe("edited");
  });

  it("falls back to narrativeDraftContent when narrativeFinalContent is null", () => {
    expect(getNarrativeContent({ narrativeDraftContent: "draft", narrativeFinalContent: null })).toBe(
      "draft",
    );
  });

  it("returns null when neither exists yet", () => {
    expect(getNarrativeContent({ narrativeDraftContent: null, narrativeFinalContent: null })).toBeNull();
  });
});
