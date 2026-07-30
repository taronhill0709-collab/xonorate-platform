import { describe, expect, it } from "vitest";
import { excerptFromMarkdown } from "@/lib/markdown";

describe("excerptFromMarkdown", () => {
  it("strips headings, bold, italic, and link syntax", () => {
    const md = "# Heading\n\nSome **bold** and *italic* text with a [link](https://example.com).";
    expect(excerptFromMarkdown(md, 200)).toBe(
      "Heading Some bold and italic text with a link.",
    );
  });

  it("returns the text unchanged when under maxLength", () => {
    expect(excerptFromMarkdown("short text", 200)).toBe("short text");
  });

  it("truncates on a word boundary and appends an ellipsis when over maxLength", () => {
    const md = "one two three four five six seven eight nine ten";
    const result = excerptFromMarkdown(md, 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result).not.toContain("  ");
  });
});
