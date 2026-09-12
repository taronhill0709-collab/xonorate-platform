/** "1.2M", "18.4K", "842" — for view/share/like counts where the exact
 * figure matters less than the scale. Use `.toLocaleString()` instead
 * wherever the precise number matters (e.g. a signature count against a goal). */
export function formatCompactCount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
