import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RedactedPhoto } from "@/components/redacted-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { getIssueBySlug, ISSUES, ISSUES_SOURCE_URL } from "@/lib/issues";

export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const issue = getIssueBySlug(slug);
    if (!issue) return { title: "Issue not found" };
    return { title: issue.title, description: issue.explanation };
  });
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = getIssueBySlug(slug);
  if (!issue) notFound();

  const allCases = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      status: cases.status,
      state: cases.state,
      photoUrl: cases.photoUrl,
      contributingFactorTags: cases.contributingFactorTags,
    })
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));

  const relatedCases = allCases.filter((c) =>
    ((c.contributingFactorTags as string[] | null) ?? []).includes(issue.tag),
  );

  const otherIssues = ISSUES.filter((i) => i.slug !== issue.slug);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              The issues
            </p>
            <h1 className="mt-2 font-serif text-4xl text-header-foreground sm:text-5xl">
              {issue.title}
            </h1>
            <p className="mt-3 text-lg text-header-muted">{issue.dek}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          {issue.stat && (
            <div className="border-b border-border pb-8">
              <p className="font-serif text-5xl text-brand tabular-nums">{issue.stat.value}</p>
              <p className="mt-2 text-sm text-muted">
                {issue.stat.label} involved {issue.title.toLowerCase()}
                {" — "}
                <a
                  href={ISSUES_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link underline hover:text-link-strong"
                >
                  Innocence Project
                </a>
              </p>
            </div>
          )}

          <p className="mt-8 text-lg text-foreground">{issue.explanation}</p>

          {relatedCases.length > 0 && (
            <section className="mt-12">
              <p className="text-xs font-bold tracking-widest text-brand uppercase">
                Related Xonorate cases
              </p>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {relatedCases.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.slug}`}
                    className="group flex gap-4 border border-border p-4 transition hover:border-brand/50"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden">
                      {c.photoUrl ? (
                        <Image
                          src={c.photoUrl}
                          alt={c.clientName}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <RedactedPhoto seed={i} />
                      )}
                    </div>
                    <div>
                      <span className="inline-block border border-brand/50 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                        {CASE_STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      <p className="mt-1.5 font-serif text-lg text-foreground">{c.clientName}</p>
                      <p className="font-mono text-xs font-bold text-label uppercase">{c.state}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2">
            <Link
              href="/news"
              className="border border-border p-5 transition hover:border-brand/50"
            >
              <p className="font-serif text-lg text-foreground">Newsroom coverage</p>
              <p className="mt-1 text-sm text-muted">
                Read Xonorate&apos;s ongoing investigations and case developments.
              </p>
            </Link>
            <Link
              href="/resources"
              className="border border-border p-5 transition hover:border-brand/50"
            >
              <p className="font-serif text-lg text-foreground">Resources</p>
              <p className="mt-1 text-sm text-muted">
                Legal resources, innocence organizations, and support services.
              </p>
            </Link>
          </section>

          <section className="mt-12 border-t border-border pt-8">
            <p className="text-xs font-bold tracking-widest text-label uppercase">
              Other issues
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherIssues.map((other) => (
                <Link
                  key={other.slug}
                  href={`/issues/${other.slug}`}
                  className="border border-border px-3 py-1.5 text-xs font-bold tracking-wide text-muted uppercase transition hover:border-brand hover:text-foreground"
                >
                  {other.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
