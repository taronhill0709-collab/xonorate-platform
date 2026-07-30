import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips apostrophes rather than turning them into hyphens", () => {
    expect(slugify("Barge's Case")).toBe("barges-case");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugify("A --- B!!  C")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-- Hello --")).toBe("hello");
  });
});
