import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { MarkdownBody } from "@/components/markdown-body";
import { AUTHORITY_TIER_LABEL, KNOWLEDGE_SOURCE_KIND_LABEL } from "@/lib/knowledge-sources";
import type { knowledgeSources } from "@/db/schema";

/** A conditionally-rendered prose section — the core building block of the
 * deep-resource template. Renders nothing if `body` is null/empty, so a
 * legacy shallow resource (no knowledge-hub fields populated) never shows
 * an empty heading. */
export function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <section className="mt-12 border-t border-border pt-10 first:mt-0 first:border-t-0 first:pt-0">
      <Eyebrow text={title} as="h2" />
      <div className="mt-4">
        <MarkdownBody>{body}</MarkdownBody>
      </div>
    </section>
  );
}

export function KeyFactCallout({
  stat,
  label,
  source,
}: {
  stat: string | null;
  label: string | null;
  source: { title: string; url: string | null } | null;
}) {
  if (!stat) return null;
  return (
    <div className="border border-brand bg-brand-light p-6">
      <p className="font-serif text-5xl text-brand">{stat}</p>
      {label && <p className="mt-2 text-sm text-foreground">{label}</p>}
      {source && (
        <p className="mt-3 font-mono text-xs text-muted">
          Source:{" "}
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
              {source.title}
            </a>
          ) : (
            source.title
          )}
        </p>
      )}
    </div>
  );
}

export function QuestionList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-10">
      <Eyebrow text={title} as="h2" />
      <ol className="mt-4 space-y-3">
        {items.map((q, i) => (
          <li key={q} className="flex gap-3 text-foreground">
            <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export type WhatYouCanDoItem = { label: string; description?: string; href?: string };

export function WhatYouCanDoList({ items }: { items: WhatYouCanDoItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-10">
      <Eyebrow text="What you can do" as="h2" />
      <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        {items.map((item) => {
          const inner = (
            <>
              <p className="font-serif text-lg text-foreground">{item.label}</p>
              {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
            </>
          );
          return item.href ? (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="bg-background p-4 transition hover:bg-header-background"
            >
              {inner}
            </a>
          ) : (
            <div key={item.label} className="bg-background p-4">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type SourceRow = typeof knowledgeSources.$inferSelect;

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

function SourceCard({ source }: { source: SourceRow }) {
  return (
    <div className="border border-border p-4">
      <p className="font-serif text-base text-foreground">{source.title}</p>
      <p className="mt-1 font-mono text-xs tracking-wide text-muted uppercase">
        {KNOWLEDGE_SOURCE_KIND_LABEL[source.sourceKind] ?? source.sourceKind}
        {source.organization ? ` · ${source.organization}` : ""}
        {source.publicationDate ? ` · ${DATE_FMT.format(source.publicationDate)}` : ""}
      </p>
      {source.citation && <p className="mt-1 text-xs text-muted">{source.citation}</p>}
      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-brand hover:underline">
          View source ↗
        </a>
      )}
    </div>
  );
}

/** Splits a resource's linked knowledgeSources into "what the law says"
 * (tier 1-2: primary authority + official/government) and "research & data"
 * (tier 3-4: academic + established organizations) — tier 5 (Xonorate) is
 * surfaced separately via the xonorateFindings field, not here. Renders
 * nothing for a tier with no linked sources. */
export function LegalAndResearchSources({ sources }: { sources: SourceRow[] }) {
  if (sources.length === 0) return null;
  const law = sources.filter((s) => s.authorityTier <= 2);
  const research = sources.filter((s) => s.authorityTier === 3 || s.authorityTier === 4);

  return (
    <>
      {law.length > 0 && (
        <section className="mt-12 border-t border-border pt-10">
          <Eyebrow text="What the law generally says" as="h2" />
          <p className="mt-2 text-sm text-muted">
            General legal information drawn from published, verified authority — not a statement of how the law
            applies to any specific case.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {law.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </section>
      )}
      {research.length > 0 && (
        <section className="mt-12 border-t border-border pt-10">
          <Eyebrow text="Research & data" as="h2" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {research.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function SourcesFooter({ sources }: { sources: SourceRow[] }) {
  if (sources.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-10">
      <Eyebrow text="Sources & further reading" as="h2" />
      <div className="mt-4 space-y-3">
        {sources.map((s) => (
          <div key={s.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="text-foreground">{s.title}</span>
            <span className="text-xs text-muted">
              {AUTHORITY_TIER_LABEL[s.authorityTier] ?? ""}
              {s.organization ? ` · ${s.organization}` : ""}
              {s.publicationDate ? ` · ${DATE_FMT.format(s.publicationDate)}` : ""}
            </span>
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AskXonorateCta({ topic }: { topic: string }) {
  return (
    <section className="mt-12 border border-brand bg-brand-light p-6">
      <p className="text-xs font-bold tracking-widest text-brand uppercase">Have questions about this issue?</p>
      <p className="mt-2 font-serif text-xl text-foreground">
        Ask Xonorate can help you explore the research, legal framework, and related Xonorate material.
      </p>
      <Link
        href={`/ask?topic=${encodeURIComponent(topic)}`}
        className="mt-4 inline-block bg-brand px-6 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
      >
        Ask Xonorate →
      </Link>
    </section>
  );
}

export function RelatedInvestigations({
  investigations,
}: {
  investigations: { id: string; title: string; slug: string; subtitle: string | null }[];
}) {
  if (investigations.length === 0) return null;
  return (
    <div>
      <Eyebrow text="Related investigates" />
      <div className="mt-3 space-y-3">
        {investigations.map((inv) => (
          <Link key={inv.id} href={`/investigations/${inv.slug}`} className="group block border border-border p-3">
            <p className="font-serif text-lg text-foreground group-hover:text-brand">{inv.title}</p>
            {inv.subtitle && <p className="mt-1 line-clamp-2 text-xs text-muted">{inv.subtitle}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
