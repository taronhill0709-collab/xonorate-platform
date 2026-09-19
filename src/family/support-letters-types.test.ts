import { describe, expect, it } from "vitest";
import { getLetterContent, resolveQuestionLabel } from "./support-letters-types";

describe("getLetterContent", () => {
  it("prefers finalContent over draftContent when both exist", () => {
    expect(getLetterContent({ draftContent: "draft", finalContent: "edited" })).toBe("edited");
  });

  it("falls back to draftContent when finalContent is null", () => {
    expect(getLetterContent({ draftContent: "draft", finalContent: null })).toBe("draft");
  });

  it("returns null when neither exists yet", () => {
    expect(getLetterContent({ draftContent: null, finalContent: null })).toBeNull();
  });
});

describe("resolveQuestionLabel", () => {
  it("substitutes the loved one's name", () => {
    expect(resolveQuestionLabel("How do you know {{lovedOne}}?", "James")).toBe(
      "How do you know James?",
    );
  });

  it("substitutes every occurrence", () => {
    expect(resolveQuestionLabel("{{lovedOne}} and {{lovedOne}} again", "James")).toBe(
      "James and James again",
    );
  });

  it("leaves a label with no placeholder unchanged", () => {
    expect(resolveQuestionLabel("Anything else to add?", "James")).toBe("Anything else to add?");
  });
});
