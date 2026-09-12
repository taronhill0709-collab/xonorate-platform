/** Strips markdown syntax down to a plain-text teaser for cards and meta
 * descriptions — used by both the newsroom index and each article's
 * generateMetadata, so it lives here once rather than twice. */
export function excerptFromMarkdown(markdown: string, maxLength = 200): string {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}
