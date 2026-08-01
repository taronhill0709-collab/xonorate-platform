/** "Priya Supporter" -> "Priya S." — public display only (e.g. "Why people
 * are signing"); admin views still show the full name for moderation. */
export function formatSignerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`;
}
