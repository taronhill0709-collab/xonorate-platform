import Link from "next/link";

// Shared contextual nudge toward Ask Xonorate — used on case, investigation,
// and issue pages so the knowledge system surfaces throughout the site
// rather than only living behind the Resource Center/Knowledge nav. Kept
// deliberately subtle (one box, one CTA) rather than a repeated giant
// banner — the same visual treatment already used on resource pages
// (see resources/[slug]/resource-sections.tsx's own AskXonorateCta).
export function AskXonorateCta({
  topic,
  question,
  body = "Ask Xonorate can help you explore the research, legal framework, and related Xonorate material.",
}: {
  topic: string;
  question: string;
  body?: string;
}) {
  return (
    <div className="border border-brand bg-brand-light p-6">
      <p className="text-xs font-bold tracking-widest text-brand uppercase">{question}</p>
      <p className="mt-2 font-serif text-xl text-foreground">{body}</p>
      <Link
        href={`/ask?topic=${encodeURIComponent(topic)}`}
        className="mt-4 inline-block bg-brand px-6 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
      >
        Ask Xonorate →
      </Link>
    </div>
  );
}
