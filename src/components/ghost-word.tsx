export function GhostWord({ word, className }: { word: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute font-serif leading-none font-bold tracking-[0.06em] text-accent uppercase opacity-[0.12] dark:opacity-[0.07] ${className ?? ""}`}
    >
      {word}
    </span>
  );
}
