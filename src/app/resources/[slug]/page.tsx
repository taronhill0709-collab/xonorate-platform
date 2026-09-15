import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { JsonLd } from "@/components/json-ld";
import { MarkdownBody } from "@/components/markdown-body";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import {
  cases,
  investigations,
  knowledgeSources,
  resourceCaseLinks,
  resourceInvestigationLinks,
  resourceIssueLinks,
  resourceKnowledgeSourceLinks,
  resources,
} from "@/db/schema";
import { ISSUES } from "@/lib/issues";
import { getOrigin } from "@/lib/request-ip";
import { audienceLabel, RESOURCE_CATEGORY_LABEL, RESOURCE_TYPE_LABEL } from "@/lib/resource-taxonomy";
import {
  AskXonorateCta,
  KeyFactCallout,
  LegalAndResearchSources,
  QuestionList,
  RelatedInvestigations,
  Section,
  SourcesFooter,
  WhatYouCanDoList,
  type WhatYouCanDoItem,
} from "./resource-sections";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [resource] = await db
    .select({ title: resources.title, description: resources.description, status: resources.status })
    .from(resources)
    .where(eq(resources.slug, slug))
    .limit(1);

  if (!resource || resource.status !== "published") return { title: "Resource not found" };

  const origin = await getOrigin();
  const url = `${origin}/resources/${slug}`;

  return {
    title: resource.title,
    description: resource.description,
    alternates: { canonical: url },
    openGraph: { title: resource.title, description: resource.description, url, type: "article" },
    twitter: { card: "summary", title: resource.title, description: resource.description },
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [resource] = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1);
  if (!resource || resource.status !== "published") notFound();

  const origin = await getOrigin();
  const url = `${origin}/resources/${slug}`;

  const [issueLinkRows, caseLinkRows, investigationLinkRows, sourceLinkRows, keyFactSourceRow] = await Promise.all([
    db.select({ issueTag: resourceIssueLinks.issueTag }).from(resourceIssueLinks).where(eq(resourceIssueLinks.resourceId, resource.id)),
    db
      .select({ id: cases.id, clientName: cases.clientName, slug: cases.slug, summary: cases.summary })
      .from(resourceCaseLinks)
      .innerJoin(cases, eq(resourceCaseLinks.caseId, cases.id))
      .where(eq(resourceCaseLinks.resourceId, resource.id)),
    db
      .select({ id: investigations.id, title: investigations.title, slug: investigations.slug, subtitle: investigations.subtitle })
      .from(resourceInvestigationLinks)
      .innerJoin(investigations, eq(resourceInvestigationLinks.investigationId, investigations.id))
      .where(eq(resourceInvestigationLinks.resourceId, resource.id)),
    db
      .select({ source: knowledgeSources })
      .from(resourceKnowledgeSourceLinks)
      .innerJoin(knowledgeSources, eq(resourceKnowledgeSourceLinks.sourceId, knowledgeSources.id))
      .where(eq(resourceKnowledgeSourceLinks.resourceId, resource.id)),
    resource.keyFactSourceId
      ? db
          .select({ title: knowledgeSources.title, url: knowledgeSources.url })
          .from(knowledgeSources)
          .where(eq(knowledgeSources.id, resource.keyFactSourceId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const relatedIssues = issueLinkRows
    .map((r) => ISSUES.find((i) => i.tag === r.issueTag))
    .filter((i): i is (typeof ISSUES)[number] => i !== undefined);
  const audiences = (resource.audiences as string[] | null) ?? [];
  const linkedSources = sourceLinkRows.map((r) => r.source).sort((a, b) => a.authorityTier - b.authorityTier);
  const questionsToAsk = (resource.questionsToAsk as string[] | null) ?? [];
  const whatYouCanDo = (resource.whatYouCanDo as WhatYouCanDoItem[] | null) ?? [];
  const keyFactSource = keyFactSourceRow[0] ?? null;

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: resource.title,
          description: resource.description,
          datePublished: (resource.publishedAt ?? resource.createdAt).toISOString(),
          dateModified: resource.updatedAt.toISOString(),
          author: { "@type": "Organization", name: "Xonorate" },
          publisher: { "@type": "Organization", name: "Xonorate" },
          mainEntityOfPage: url,
        }}
      />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-12">
            <Eyebrow text={`${RESOURCE_CATEGORY_LABEL[resource.category] ?? resource.category}`} />
            <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-5xl">{resource.title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-header-muted">{resource.description}</p>
            <p className="mt-5 font-mono text-xs font-bold tracking-wide text-header-label uppercase">
              {RESOURCE_TYPE_LABEL[resource.resourceType] ?? resource.resourceType}
              {resource.organization ? ` · ${resource.organization}` : ""}
              {resource.state ? ` · ${resource.state}` : ""}
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
            <div className="max-w-3xl">
              <KeyFactCallout stat={resource.keyFactStat} label={resource.keyFactLabel} source={keyFactSource} />

              {resource.body && <MarkdownBody>{resource.body}</MarkdownBody>}

              <Section title="Overview" body={resource.overview} />
              <Section title="Why it matters" body={resource.whyItMatters} />
              <Section title="How it happens" body={resource.howItHappens} />
              <Section title="What to know" body={resource.whatToKnow} />
              <Section title="What to look for" body={resource.whatToLookFor} />
              <QuestionList title="Questions to ask" items={questionsToAsk} />
              <LegalAndResearchSources sources={linkedSources} />
              <Section title="What Xonorate has found" body={resource.xonorateFindings} />
              <WhatYouCanDoList items={whatYouCanDo} />

              {resource.url && (
                <section className={resource.body ? "mt-12 border-t border-border pt-8" : ""}>
                  <Eyebrow text="Further reading" />
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block border border-border p-5 transition hover:border-brand"
                  >
                    <p className="font-serif text-lg text-foreground">
                      {resource.organization ?? resource.title} ↗
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                      {resource.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </p>
                  </a>
                </section>
              )}

              <AskXonorateCta topic={resource.subcategory || resource.title} />

              <SourcesFooter sources={linkedSources} />

              {audiences.length > 0 && (
                <section className="mt-10">
                  <p className="text-xs font-bold tracking-widest text-label uppercase">Relevant to</p>
                  <p className="mt-2 text-sm text-muted">{audiences.map(audienceLabel).join(", ")}</p>
                </section>
              )}

              <div className="mt-10">
                <p className="font-mono text-xs text-muted">
                  {resource.lastReviewedAt
                    ? `Last reviewed ${DATE_FORMAT.format(resource.lastReviewedAt)}${resource.reviewedBy ? ` by ${resource.reviewedBy}` : ""}.`
                    : "This resource has not yet been reviewed for currency."}{" "}
                  {resource.disclaimer ??
                    "This is general information and research, not legal advice, and Xonorate is not a law firm."}
                </p>
              </div>

              <div className="mt-6">
                <ShareButtons url={url} title={resource.title} />
              </div>
            </div>

            <aside className="space-y-8">
              {relatedIssues.length > 0 && (
                <div>
                  <Eyebrow text="Related issues" />
                  <div className="mt-3 space-y-2">
                    {relatedIssues.map((issue) => (
                      <Link
                        key={issue.slug}
                        href={`/issues/${issue.slug}`}
                        className="block border border-border p-3 transition hover:border-brand"
                      >
                        <p className="font-serif text-lg text-foreground">{issue.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {caseLinkRows.length > 0 && (
                <div>
                  <Eyebrow text="Related cases" />
                  <div className="mt-3 space-y-3">
                    {caseLinkRows.map((c) => (
                      <Link key={c.id} href={`/cases/${c.slug}`} className="group block border border-border p-3">
                        <p className="font-serif text-lg text-foreground group-hover:text-brand">{c.clientName}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{c.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <RelatedInvestigations investigations={investigationLinkRows} />

              <div className="border border-brand bg-brand-light p-5">
                <p className="font-serif text-xl text-brand">More resources</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href={`/resources/browse?category=${resource.category}`}
                    className="bg-brand px-4 py-2 text-center text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
                  >
                    Browse {RESOURCE_CATEGORY_LABEL[resource.category] ?? resource.category} →
                  </Link>
                  <Link
                    href="/resources"
                    className="border border-brand px-4 py-2 text-center text-xs font-bold tracking-widest text-brand uppercase transition hover:bg-brand hover:text-brand-foreground"
                  >
                    Back to Resource Center
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
