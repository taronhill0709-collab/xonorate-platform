import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskXonorateCta } from "@/components/ask-xonorate-cta";
import { Eyebrow } from "@/components/eyebrow";
import { JsonLd } from "@/components/json-ld";
import { MarkdownBody } from "@/components/markdown-body";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import {
  cases,
  contentSources,
  intelligenceItems,
  investigationCaseLinks,
  investigationMaterials,
  investigations,
  investigationTimelineEntries,
  petitions,
} from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/post-excerpt";
import { getOrigin, resolveShareImage } from "@/lib/request-ip";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const TIMELINE_DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [investigation] = await db
    .select({
      title: investigations.title,
      subtitle: investigations.subtitle,
      summary: investigations.summary,
      heroImageUrl: investigations.heroImageUrl,
      status: investigations.status,
    })
    .from(investigations)
    .where(eq(investigations.slug, slug))
    .limit(1);

  if (!investigation || investigation.status !== "published") return { title: "Investigation not found" };

  const description = investigation.subtitle ?? excerptFromMarkdown(investigation.summary);
  const origin = await getOrigin();
  const url = `${origin}/investigations/${slug}`;
  const shareImage = resolveShareImage(investigation.heroImageUrl, origin, `${origin}/opengraph-image`);

  return {
    title: investigation.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: investigation.title, description, url, type: "article", images: [shareImage] },
    twitter: { card: "summary_large_image", title: investigation.title, description, images: [shareImage] },
  };
}

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [investigation] = await db.select().from(investigations).where(eq(investigations.slug, slug)).limit(1);
  if (!investigation || investigation.status !== "published") notFound();

  const origin = await getOrigin();

  const [timelineEntries, caseLinkRows, sourceRows, publicMaterials] = await Promise.all([
    db
      .select()
      .from(investigationTimelineEntries)
      .where(eq(investigationTimelineEntries.investigationId, investigation.id))
      .orderBy(investigationTimelineEntries.sortOrder, investigationTimelineEntries.eventDate),
    db
      .select({ id: cases.id, clientName: cases.clientName, slug: cases.slug, summary: cases.summary })
      .from(investigationCaseLinks)
      .innerJoin(cases, eq(investigationCaseLinks.caseId, cases.id))
      .where(eq(investigationCaseLinks.investigationId, investigation.id)),
    db
      .select({ sourcePublication: intelligenceItems.sourcePublication, sourceUrl: intelligenceItems.sourceUrl })
      .from(contentSources)
      .innerJoin(intelligenceItems, eq(contentSources.intelligenceItemId, intelligenceItems.id))
      .where(and(eq(contentSources.targetType, "investigation"), eq(contentSources.targetId, investigation.id))),
    db
      .select({ title: investigationMaterials.title, fileUrl: investigationMaterials.fileUrl })
      .from(investigationMaterials)
      .where(and(eq(investigationMaterials.investigationId, investigation.id), eq(investigationMaterials.isPublicSource, true)))
      .orderBy(investigationMaterials.sortOrder),
  ]);

  const relatedPetition =
    caseLinkRows.length > 0
      ? (
          await db
            .select({ title: petitions.title, slug: petitions.slug })
            .from(petitions)
            .where(and(eq(petitions.caseId, caseLinkRows[0].id), eq(petitions.status, "published")))
            .orderBy(desc(petitions.createdAt))
            .limit(1)
        )[0]
      : null;

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: investigation.title,
          description: investigation.subtitle ?? excerptFromMarkdown(investigation.summary),
          image: investigation.heroImageUrl ? [new URL(investigation.heroImageUrl, origin).toString()] : undefined,
          datePublished: (investigation.publishedAt ?? investigation.createdAt).toISOString(),
          author: { "@type": "Organization", name: "Xonorate" },
          publisher: { "@type": "Organization", name: "Xonorate" },
          mainEntityOfPage: `${origin}/investigations/${slug}`,
        }}
      />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          {investigation.heroImageUrl && (
            <div className="relative aspect-21/9 max-h-[520px] w-full overflow-hidden">
              <Image src={investigation.heroImageUrl} alt="" fill sizes="100vw" className="object-cover" unoptimized />
            </div>
          )}
          <div className="mx-auto w-full max-w-3xl px-6 py-12">
            <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">Xonorate Investigates</p>
            <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-5xl">{investigation.title}</h1>
            {investigation.subtitle && <p className="mt-3 max-w-2xl text-lg text-header-muted">{investigation.subtitle}</p>}
            <p className="mt-5 font-mono text-xs font-bold tracking-wide text-header-label uppercase">
              By Xonorate · {DATE_FORMAT.format(investigation.publishedAt ?? investigation.createdAt)}
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
            <div className="max-w-3xl">
              {investigation.thesis && (
                <section className="border-l-4 border-brand bg-muted-background p-6">
                  <Eyebrow text="The question" />
                  <p className="mt-2 font-serif text-2xl text-foreground">{investigation.thesis}</p>
                </section>
              )}

              {investigation.body ? (
                <div className="mt-10">
                  <MarkdownBody>{investigation.body}</MarkdownBody>
                </div>
              ) : (
                <p className="mt-10 text-muted">{investigation.summary}</p>
              )}

              {timelineEntries.length > 0 && (
                <section className="mt-12 border-t border-border pt-8">
                  <Eyebrow text="The timeline" />
                  <div className="mt-4 space-y-5">
                    {timelineEntries.map((entry) => (
                      <div key={entry.id} className="flex gap-4">
                        <p className="w-24 shrink-0 font-mono text-xs font-bold text-brand uppercase">
                          {entry.eventDate ? TIMELINE_DATE_FORMAT.format(entry.eventDate) : "—"}
                        </p>
                        <div>
                          <p className="font-serif text-lg text-foreground">{entry.title}</p>
                          {entry.body && <p className="mt-1 text-sm text-muted">{entry.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-10">
                <ShareButtons url={`${origin}/investigations/${slug}`} title={investigation.title} />
              </div>
            </div>

            <aside className="space-y-8">
              {caseLinkRows.length > 0 && (
                <div>
                  <Eyebrow text="The cases" />
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

              {(sourceRows.length > 0 || publicMaterials.length > 0) && (
                <div>
                  <p className="text-xs font-bold tracking-widest text-label uppercase">Sources</p>
                  <ul className="mt-3 space-y-1.5">
                    {sourceRows.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-link hover:text-link-strong hover:underline"
                        >
                          {s.sourcePublication} ↗
                        </a>
                      </li>
                    ))}
                    {publicMaterials.map((m, i) =>
                      m.fileUrl ? (
                        <li key={`m-${i}`}>
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-link hover:text-link-strong hover:underline"
                          >
                            {m.title} ↗
                          </a>
                        </li>
                      ) : (
                        <li key={`m-${i}`} className="text-sm text-muted">
                          {m.title}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              <AskXonorateCta
                topic={investigation.title}
                question="Want to explore the research behind this issue?"
              />

              {(caseLinkRows.length > 0 || relatedPetition) && (
                <div className="border border-brand bg-brand-light p-5">
                  <p className="font-serif text-xl text-brand">Take action</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {caseLinkRows[0] && (
                      <Link
                        href={`/cases/${caseLinkRows[0].slug}`}
                        className="bg-brand px-4 py-2 text-center text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
                      >
                        View the case →
                      </Link>
                    )}
                    {relatedPetition && (
                      <Link
                        href={`/petitions/${relatedPetition.slug}`}
                        className="border border-brand px-4 py-2 text-center text-xs font-bold tracking-widest text-brand uppercase transition hover:bg-brand hover:text-brand-foreground"
                      >
                        Sign the petition
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
