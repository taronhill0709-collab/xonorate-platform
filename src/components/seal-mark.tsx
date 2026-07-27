export function SealMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" aria-hidden="true" className={className}>
      <polygon points="30,58 110,18 190,58" stroke="currentColor" strokeWidth="3" />
      <rect x="34" y="58" width="10" height="62" fill="currentColor" />
      <rect x="64" y="58" width="10" height="62" fill="currentColor" />
      <rect x="94" y="58" width="10" height="62" fill="currentColor" />
      <rect x="124" y="58" width="10" height="62" fill="currentColor" />
      <rect x="154" y="58" width="10" height="62" fill="currentColor" />
      <rect x="20" y="120" width="180" height="10" fill="currentColor" />
    </svg>
  );
}
