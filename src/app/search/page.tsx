import { and, eq, ilike, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, posts } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { ISSUES } from "@/lib/issues";
import { PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [caseResults, postResults] = query
    ? await Promise.all([
        db
          .select({
            id: cases.id,
            clientName: cases.clientName,
            slug: cases.slug,
            status: cases.status,
            state: cases.state,
          })
          .from(cases)
          .where(or(ilike(cases.clientName, `%${query}%`), ilike(cases.state, `%${query}%`)))
          .limit(20),
        db
          .select({ id: posts.id, title: posts.title, slug: posts.slug, type: posts.type })
          .from(posts)
          .where(and(eq(posts.status, "published"), ilike(posts.title, `%${query}%`)))
          .limit(20),
      ])
    : [[], []];

  const issueResults = query
    ? ISSUES.filter((issue) => issue.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const totalResults = caseResults.length + postResults.length + issueResults.length;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Eyebrow text="Search" />
        <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
          {query ? `Results for "${query}"` : "Search Xonorate"}
        </h1>

        <form action="/search" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search cases, news, or issues…"
            className="w-full border border-border bg-muted-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
          >
            Search
          </button>
        </form>

        {query && totalResults === 0 && (
          <p className="mt-10 border border-dashed border-border p-8 text-center text-sm text-muted">
            No results for &quot;{query}&quot;.
          </p>
        )}

        {caseResults.length > 0 && (
          <section className="mt-10">
            <Eyebrow text="Cases" />
            <ul className="mt-3 divide-y divide-border border-t border-b border-border">
              {caseResults.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cases/${c.slug}`}
                    className="flex items-baseline justify-between gap-3 py-3 transition hover:bg-muted-background"
                  >
                    <span className="font-serif text-lg text-foreground">{c.clientName}</span>
                    <span className="shrink-0 font-mono text-xs font-bold tracking-wide text-label uppercase">
                      {c.state} · {CASE_STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {postResults.length > 0 && (
          <section className="mt-10">
            <Eyebrow text="Newsroom" />
            <ul className="mt-3 divide-y divide-border border-t border-b border-border">
              {postResults.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/news/${p.slug}`}
                    className="flex items-baseline justify-between gap-3 py-3 transition hover:bg-muted-background"
                  >
                    <span className="font-serif text-lg text-foreground">{p.title}</span>
                    <span className="shrink-0 font-mono text-xs font-bold tracking-wide text-label uppercase">
                      {PUBLIC_POST_TYPE_LABEL[p.type] ?? p.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {issueResults.length > 0 && (
          <section className="mt-10">
            <Eyebrow text="The Issues" />
            <ul className="mt-3 divide-y divide-border border-t border-b border-border">
              {issueResults.map((issue) => (
                <li key={issue.slug}>
                  <Link
                    href={`/issues/${issue.slug}`}
                    className="block py-3 font-serif text-lg text-foreground transition hover:bg-muted-background"
                  >
                    {issue.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
