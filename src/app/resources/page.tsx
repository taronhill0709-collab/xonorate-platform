import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { RESOURCE_CATEGORIES, RESOURCE_CATEGORY_DEK, RESOURCE_CATEGORY_LABEL } from "@/lib/resource-taxonomy";

export const metadata: Metadata = {
  title: "Xonorate Resource Center",
  description:
    "Knowledge, tools, and pathways for understanding wrongful convictions and pursuing justice — practical guides, legal resources, research, advocacy tools, organizations, and educational materials.",
};

// New resources are added via the admin CMS at any time — never statically prerendered.
export const dynamic = "force-dynamic";

const PATHWAYS = [
  {
    title: "Understanding a wrongful conviction",
    body: "Learn how wrongful convictions happen and what issues commonly contribute to them.",
    href: "/resources/browse?category=knowledge",
  },
  {
    title: "Finding legal help",
    body: "Find legal organizations, innocence organizations, conviction-review resources, and other relevant legal information.",
    href: "/resources/browse?category=legal",
  },
  {
    title: "Researching a case",
    body: "Find case-related research, public records, legal information, and investigative resources.",
    href: "/resources/browse?category=case_resource",
  },
  {
    title: "Helping someone",
    body: "Resources for families, advocates, and people supporting someone affected by a wrongful conviction.",
    href: "/resources/browse?category=help_support",
  },
  {
    title: "Taking action",
    body: "Find petitions, advocacy tools, outreach resources, and ways to support justice campaigns.",
    href: "/resources/browse?category=advocacy",
  },
  {
    title: "Learning about the system",
    body: "Understand the causes, procedures, institutions, and issues surrounding wrongful convictions.",
    href: "/issues",
  },
] as const;

export default async function ResourcesHubPage() {
  const [categoryCountRows, featuredRows] = await Promise.all([
    db
      .select({ category: resources.category, value: count() })
      .from(resources)
      .where(eq(resources.status, "published"))
      .groupBy(resources.category),
    db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        description: resources.description,
        category: resources.category,
      })
      .from(resources)
      .where(and(eq(resources.status, "published"), eq(resources.featured, true)))
      .limit(1),
  ]);

  const countByCategory = new Map(categoryCountRows.map((r) => [r.category, r.value]));
  const featured = featuredRows[0] ?? null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-16">
            <Eyebrow text="Xonorate Knowledge Center" />
            <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-6xl">
              Knowledge is a tool for justice.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-header-muted">
              Explore research, legal information, documented cases, investigative reporting, practical resources,
              and tools for understanding wrongful convictions and the systems surrounding them.
            </p>
            <form action="/resources/browse" className="mt-6 flex gap-2">
              <input
                type="search"
                name="q"
                placeholder="Search wrongful-conviction resources…"
                className="w-full border border-header-border bg-header-background px-4 py-2.5 text-sm text-header-foreground placeholder:text-header-muted focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
              >
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/resources/start-here"
                className="inline-block font-mono text-xs font-bold tracking-widest text-link uppercase hover:text-link-strong"
              >
                New here? Start here →
              </Link>
            </div>
          </div>
        </div>

        {/* ASK XONORATE — made one of the first things a visitor sees on
            the Knowledge Center, not a link buried in the hero's fine
            print. Same premium-research-tool treatment (bordered box,
            editorial type, no chat-widget or AI-gradient styling) as the
            homepage's Knowledge section panel. */}
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <div className="border border-brand bg-brand-light p-8 sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <Eyebrow text="Ask Xonorate" />
                  <h2 className="mt-3 font-serif text-2xl text-header-foreground sm:text-3xl">
                    Have a question about a wrongful conviction or the justice system?
                  </h2>
                  <p className="mt-3 text-header-muted">
                    Ask Xonorate and explore answers grounded in Xonorate&apos;s knowledge base and curated legal and
                    research sources.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <Link
                    href="/ask"
                    className="inline-flex items-center justify-center bg-brand px-8 py-4 text-sm font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
                  >
                    Ask Xonorate →
                  </Link>
                  <p className="font-mono text-[10px] tracking-wide text-header-muted uppercase">
                    Research-grounded information. Not legal advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pt-14">
          <Eyebrow text="Explore the Knowledge Center" as="h2" />
          <p className="mt-2 max-w-2xl text-muted">
            Research, legal information, documented cases, investigative reporting, and practical resources — start
            here, or find what you&apos;re looking for below.
          </p>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <Eyebrow text="What are you looking for?" />
          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {PATHWAYS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group flex flex-col gap-3 bg-background p-6 transition hover:bg-muted-background"
              >
                <h2 className="font-serif text-xl text-foreground">{p.title}</h2>
                <p className="text-sm text-muted">{p.body}</p>
                <span className="mt-auto pt-3 font-mono text-[11px] font-bold tracking-wide text-brand uppercase transition group-hover:text-accent">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>

        {featured && (
          <div className="border-y border-header-border bg-header-background">
            <div className="mx-auto w-full max-w-6xl px-6 py-14">
              <Eyebrow text="Featured resource" />
              <Link href={`/resources/${featured.slug}`} className="group mt-4 block">
                <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">
                  {RESOURCE_CATEGORY_LABEL[featured.category] ?? featured.category}
                </p>
                <h2 className="mt-2 max-w-2xl font-serif text-3xl text-header-foreground transition group-hover:text-brand sm:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-xl text-header-muted">{featured.description}</p>
                <span className="mt-4 inline-block font-mono text-xs font-bold tracking-widest text-header-foreground uppercase transition group-hover:text-brand">
                  Start here →
                </span>
              </Link>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <Eyebrow text="Browse by category" />
          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_CATEGORIES.filter((c) => (countByCategory.get(c) ?? 0) > 0).map((c) => (
              <Link
                key={c}
                href={`/resources/browse?category=${c}`}
                className="group flex flex-col gap-3 bg-background p-6 transition hover:bg-muted-background"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-xl text-foreground">{RESOURCE_CATEGORY_LABEL[c]}</h2>
                  <span className="shrink-0 font-serif text-2xl text-brand tabular-nums">{countByCategory.get(c)}</span>
                </div>
                <p className="text-sm text-muted">{RESOURCE_CATEGORY_DEK[c]}</p>
                <span className="mt-auto pt-3 font-mono text-[11px] font-bold tracking-wide text-brand uppercase transition group-hover:text-accent">
                  Browse →
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            Looking for everything at once?{" "}
            <Link href="/resources/browse" className="text-brand underline">
              Browse the full Resource Center
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
