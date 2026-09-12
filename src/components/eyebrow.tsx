/** Section-label treatment matching the reference design
 * (~/Documents/xonorate.newdesign.png): a small red bar + two-tone text
 * (muted, then bold white on the last word) — never solid red text. Red
 * stays reserved for buttons, status dots, and icons, per the brief's own
 * "don't flood the site with red" instruction. `text` is split on the
 * last space; single-word eyebrows just render muted with no bold split. */
export function Eyebrow({
  text,
  align = "left",
  as: Tag = "p",
  className = "",
}: {
  text: string;
  align?: "left" | "center";
  /** Render as a real heading (e.g. "h2") when this label is also the
   * section's heading landmark, not just decoration above a separate h1/h2. */
  as?: "p" | "h2" | "h3";
  className?: string;
}) {
  const words = text.trim().split(" ");
  const last = words.length > 1 ? words[words.length - 1] : null;
  const rest = last ? words.slice(0, -1).join(" ") : text;

  return (
    <Tag
      className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${
        align === "center" ? "justify-center" : ""
      } ${className}`}
    >
      <span className="h-3 w-1 shrink-0 bg-brand" aria-hidden />
      <span>
        <span className="text-muted">{rest}</span>
        {last && <span className="text-foreground"> {last}</span>}
      </span>
    </Tag>
  );
}
