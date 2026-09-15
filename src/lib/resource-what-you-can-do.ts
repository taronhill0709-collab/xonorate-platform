import type { WhatYouCanDoItem } from "@/app/resources/[slug]/resource-sections";

/** The admin form's "What You Can Do" textarea uses one plain-text line per
 * item — "Label | description | href" — instead of a JSON editor, matching
 * this codebase's existing convention for simple list fields (tags,
 * questionsToAsk). These two functions are the parse/serialize pair for
 * that format; kept in a plain module (not actions.ts) because a
 * "use server" file may only export async functions. */
export function parseWhatYouCanDo(raw: string | undefined): WhatYouCanDoItem[] {
  return (raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, description, href] = line.split("|").map((part) => part.trim());
      const item: WhatYouCanDoItem = { label };
      if (description) item.description = description;
      if (href) item.href = href;
      return item;
    })
    .filter((item) => item.label);
}

export function serializeWhatYouCanDo(items: WhatYouCanDoItem[]): string {
  return items
    .map((item) => [item.label, item.description ?? "", item.href ?? ""].join(" | ").replace(/(\s*\|\s*)+$/, ""))
    .join("\n");
}
