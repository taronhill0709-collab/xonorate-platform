const BAR_PATTERNS = [
  [70, 88, 52],
  [80, 60, 92],
  [66, 95, 40],
  [58, 83, 71],
];

/** Case-file "redacted document" placeholder shown wherever a case has no
 * photo — most cases don't (see src/scripts/seed-*-case.ts), so this is the
 * common state, not a rare fallback. Deliberately not a generic gray box:
 * it leans into the evidence/case-file motif rather than pretending to be
 * a photo. `seed` just varies the bar widths so a grid of these doesn't
 * look identical card to card. */
export function RedactedPhoto({ seed = 0 }: { seed?: number }) {
  const widths = BAR_PATTERNS[seed % BAR_PATTERNS.length];
  return (
    <div className="relative flex h-full w-full flex-col justify-center gap-2 overflow-hidden bg-gradient-to-br from-[#221d13] to-background p-4">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-2.5 rounded-[1px] bg-background ring-1 ring-brand/10"
          style={{ width: `${w}%` }}
        />
      ))}
      <div
        className="pointer-events-none absolute top-3 right-3 h-10 w-10 rounded-full border border-brand/40 opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-6 right-4 h-px w-8 -rotate-[32deg] bg-brand/40 opacity-60"
        aria-hidden
      />
    </div>
  );
}
