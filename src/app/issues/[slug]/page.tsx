import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskXonorateCta } from "@/components/ask-xonorate-cta";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { DATA_NOTE_DEFAULT, DOCUMENTED_CASES_NOTE_DEFAULT, getIssueBySlug, ISSUES, ISSUES_SOURCE_URL } from "@/lib/issues";
import {
  BiggerPictureSection,
  DataSection,
  DistinctionsSection,
  DocumentedCasesSection,
  LegacyDataSection,
  MechanismSection,
  ScenarioSection,
  SourcesSection,
  WhatIsItSection,
  WhyItMattersSection,
} from "./issue-sections";

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
      summary: cases.summary,
      contributingFactorTags: cases.contributingFactorTags,
    })
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));

  const relatedCases = allCases.filter((c) =>
    ((c.contributingFactorTags as string[] | null) ?? []).includes(issue.tag),
  );

  const otherIssues = ISSUES.filter((i) => i.slug !== issue.slug);
  const relatedIssues = issue.relatedIssueSlugs
    ? issue.relatedIssueSlugs
        .map((slug) => ISSUES.find((i) => i.slug === slug))
        .filter((i): i is (typeof ISSUES)[number] => i !== undefined)
    : otherIssues;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <Eyebrow text="The issues" />
            <h1 className="mt-2 font-serif text-4xl text-header-foreground sm:text-5xl">
              {issue.title}
            </h1>
            <p className="mt-3 text-lg text-header-muted">{issue.dek}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          {issue.statistics ? (
            <DataSection statistics={issue.statistics} dataNote={issue.dataNote ?? DATA_NOTE_DEFAULT} />
          ) : (
            issue.stat && (
              <LegacyDataSection stat={issue.stat} issueTitle={issue.title} sourceUrl={ISSUES_SOURCE_URL} />
            )
          )}

          <WhatIsItSection explanation={issue.explanation} />

          {issue.howItHappens && <MechanismSection steps={issue.howItHappens} />}
          {issue.whyItMatters && <WhyItMattersSection body={issue.whyItMatters} />}
          {issue.distinctions && <DistinctionsSection distinctions={issue.distinctions} />}
          {issue.scenario && <ScenarioSection scenario={issue.scenario} />}

          <DocumentedCasesSection
            cases={relatedCases}
            caseNotes={issue.caseNotes}
            note={issue.documentedCasesNote ?? DOCUMENTED_CASES_NOTE_DEFAULT}
            statusLabel={(status) => CASE_STATUS_LABEL[status] ?? status}
          />

          <section className="mt-14 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2">
            <Link
              href="/news"
              className="border border-border p-5 transition hover:border-brand/50"
            >
              <p className="font-serif text-lg text-foreground">Xonorate Investigates</p>
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

          {issue.biggerPicture && <BiggerPictureSection body={issue.biggerPicture} />}

          <div className="mt-12">
            <AskXonorateCta topic={issue.title} question="Have questions about this issue?" />
          </div>

          <section className="mt-14 border-t border-border pt-8">
            <p className="text-xs font-bold tracking-widest text-label uppercase">
              Explore related issues
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedIssues.map((other) => (
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

          {issue.sources && <SourcesSection sources={issue.sources} />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
