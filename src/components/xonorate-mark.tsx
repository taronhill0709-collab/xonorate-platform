/** The angular "X" mark used beside the wordmark in the header/footer —
 * a faceted geometric shard shape, matching the reference design
 * (~/Documents/xonorate.newdesign.png), not a photographic logo. */
export function XonorateMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <path d="M2 2L17 20L2 38H10L21 24.5L32 38H38L23 20L38 2H31L20.5 15L10 2H2Z" fill="currentColor" />
      <path d="M24 18L38 2H31L20.5 15L24 18Z" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
