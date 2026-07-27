export type CaseStat = { value: string; label: string };
export type EvidenceItem = { title: string; body: string };
export type EvidenceCategory = { title: string; items: EvidenceItem[] };
export type InnocenceClaim = {
  stats: CaseStat[];
  pullQuote: string;
  categories: EvidenceCategory[];
};

export const EVIDENCE_CATEGORY_TITLES = [
  "Evidence of innocence",
  "Newly discovered evidence",
  "Due-process violations",
  "Unreliable evidence",
] as const;

/** Admin-form field name paired with its fixed category title, in display order. */
export const EVIDENCE_CATEGORY_FIELDS = [
  { name: "evidenceOfInnocence", title: "Evidence of innocence" },
  { name: "newlyDiscoveredEvidence", title: "Newly discovered evidence" },
  { name: "dueProcessViolations", title: "Due-process violations" },
  { name: "unreliableEvidence", title: "Unreliable evidence" },
] as const;

/** One stat per line, formatted "value | label". */
export function parseStats(text: string): CaseStat[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split("|");
      return { value: value.trim(), label: rest.join("|").trim() };
    })
    .filter((s) => s.value && s.label);
}

export function serializeStats(stats: CaseStat[]): string {
  return stats.map((s) => `${s.value} | ${s.label}`).join("\n");
}

/** Items separated by a blank line; first line of each block is the title, the rest is the body. */
export function parseCategoryItems(text: string): EvidenceItem[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [title, ...bodyLines] = block.split("\n");
      return { title: title.trim(), body: bodyLines.join(" ").trim() };
    })
    .filter((item) => item.title && item.body);
}

export function serializeCategoryItems(items: EvidenceItem[]): string {
  return items.map((item) => `${item.title}\n${item.body}`).join("\n\n");
}
