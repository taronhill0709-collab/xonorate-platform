import { and, count, desc, eq, gt, ne, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/auth";
import { CaseNav, type CaseNavItem } from "@/components/case-nav";
import { CommentSection } from "@/components/comment-section";
import { Eyebrow } from "@/components/eyebrow";
import { JsonLd } from "@/components/json-ld";
import { PetitionSignForm } from "@/components/petition-sign-form";
import { RedactedPhoto } from "@/components/redacted-photo";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";
import { hasImpactContent, type CaseImpact } from "@/lib/case-impact";
import { db } from "@/db";
import {
  caseDocuments,
  caseSlugHistory,
  caseUpdates,
  caseVideos,
  cases,
  petitions,
  posts,
  signatures,
} from "@/db/schema";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";
import type { InnocenceClaim } from "@/lib/innocence-claim";
import { PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";
import { getOrigin, resolveShareImage } from "@/lib/request-ip";

// Case status/documents and the embedded petition's live count must always
// be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

type ConvictionDetails = {
  charge: string;
  year: number;
  sentence: string;
  contributingFactors: string;
};

type ExonerationDetails = {
  whatLedToExoneration: string;
  year: number;
} | null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [caseRow] = await db
    .select({
      clientName: cases.clientName,
      summary: cases.summary,
      status: cases.status,
      state: cases.state,
      photoUrl: cases.photoUrl,
    })
    .from(cases)
    .where(eq(cases.slug, slug))
    .limit(1);

  if (!caseRow) return { title: "Case not found" };

  const title = `${caseRow.clientName} — ${CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status}`;
  const origin = await getOrigin();
  const url = `${origin}/cases/${slug}`;
  const shareImage = resolveShareImage(
    caseRow.photoUrl,
    origin,
    `${origin}/opengraph-image`,
  );

  return {
    title,
    description: caseRow.summary,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: caseRow.summary,
      url,
      type: "article",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: caseRow.summary,
      images: [shareImage],
    },
  };
}

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { slug } = await params;
  const { confirmed } = await searchParams;

  const [caseRow] = await db.select().from(cases).where(eq(cases.slug, slug)).limit(1);
  if (!caseRow) {
    const [redirected] = await db
      .select({ slug: cases.slug })
      .from(caseSlugHistory)
      .innerJoin(cases, eq(caseSlugHistory.caseId, cases.id))
      .where(eq(caseSlugHistory.oldSlug, slug))
      .limit(1);
    if (redirected) permanentRedirect(`/cases/${redirected.slug}`);
    notFound();
  }

  // Fire-and-forget: a raw view counter (no dedup) showing the attention
  // this case has gotten — never blocks the page render on it.
  db.update(cases)
    .set({ viewCount: sql`${cases.viewCount} + 1` })
    .where(eq(cases.id, caseRow.id))
    .catch(() => {});

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, caseRow.id))
    .orderBy(caseDocuments.sortOrder);

  const [petition] = await db
    .select()
    .from(petitions)
    .where(and(eq(petitions.caseId, caseRow.id), eq(petitions.status, "published")))
    .orderBy(desc(petitions.createdAt))
    .limit(1);

  const signatureCount = petition
    ? ((
        await db
          .select({ value: count() })
          .from(signatures)
          .where(and(eq(signatures.petitionId, petition.id), eq(signatures.verified, true)))
      )[0]?.value ?? 0) + petition.startingSignatureCount
    : 0;

  const developments = await db
    .select()
    .from(caseUpdates)
    .where(eq(caseUpdates.caseId, caseRow.id))
    .orderBy(desc(caseUpdates.createdAt))
    .limit(10);

  const relatedReporting = await db
    .select({
      title: posts.title,
      slug: posts.slug,
      type: posts.type,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.caseId, caseRow.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(4);

  const videos = await db
    .select()
    .from(caseVideos)
    .where(eq(caseVideos.caseId, caseRow.id))
    .orderBy(caseVideos.sortOrder, caseVideos.createdAt)
    .limit(7);
  const [mainVideo, ...moreVideos] = videos;

  // "More cases" — same state first, then most recently updated. Excludes
  // exonerated cases entirely: those are resolved, and mixing them into a
  // "keep exploring" widget muddies the active/awaiting-review cases that
  // still need attention and support. No other "related" logic beyond that.
  const otherCasesPool = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      status: cases.status,
      state: cases.state,
      timeServed: cases.timeServed,
      convictionDetails: cases.convictionDetails,
    })
    .from(cases)
    .where(and(ne(cases.id, caseRow.id), ne(cases.status, "exonerated")))
    .orderBy(desc(cases.updatedAt))
    .limit(12);
  const moreCases = otherCasesPool
    .slice()
    .sort((a, b) => Number(b.state === caseRow.state) - Number(a.state === caseRow.state))
    .slice(0, 3);

  // A concrete, non-vanity payoff for the attention above: how many people
  // signed the petition after this clip went up. Only shown when we can
  // actually date the post and there's something real to report — never a
  // zero or a guess.
  const signersSincePost =
    mainVideo?.postedAt && petition
      ? (
          await db
            .select({ value: count() })
            .from(signatures)
            .where(
              and(
                eq(signatures.petitionId, petition.id),
                eq(signatures.verified, true),
                gt(signatures.createdAt, mainVideo.postedAt),
              ),
            )
        )[0]?.value ?? 0
      : 0;

  const conviction = caseRow.convictionDetails as ConvictionDetails;
  const exoneration = caseRow.exonerationDetails as ExonerationDetails;
  const innocenceClaim = caseRow.innocenceClaim as InnocenceClaim | null;
  const claimCategories = innocenceClaim?.categories ?? [];
  const impact = caseRow.impact as CaseImpact | null;
  const hasImpact = hasImpactContent(impact);
  const origin = await getOrigin();
  const contributingFactorTags = (caseRow.contributingFactorTags as string[] | null) ?? [];

  // NRE-style "Case Details" at-a-glance box — only facts that are
  // actually on file for this case are shown, since most of these are
  // optional and often unknown for manually-entered cases.
  const caseDetailFacts: [string, string][] = (
    [
      ["State", caseRow.state],
      ["County", caseRow.county],
      ["Race / ethnicity", caseRow.raceEthnicity],
      ["Sex", caseRow.sex],
      ["Age at time of crime", caseRow.ageAtCrime != null ? String(caseRow.ageAtCrime) : null],
      ["DNA evidence involved", caseRow.dnaInvolved != null ? (caseRow.dnaInvolved ? "Yes" : "No") : null],
    ] as [string, string | null][]
  ).filter((fact): fact is [string, string] => Boolean(fact[1]));

  // The timeline only ever shows dated milestones this case actually has on
  // file — conviction and (if applicable) exoneration — plus a dateless
  // "current status" marker. No arrest/legal-development dates exist in the
  // schema yet, so those brief-suggested stops are deliberately omitted
  // rather than invented.
  const timelineEvents: { year: string; label: string; detail?: string }[] = [
    { year: String(conviction.year), label: "Conviction", detail: conviction.charge },
  ];
  if (exoneration) {
    timelineEvents.push({
      year: String(exoneration.year),
      label: "Exoneration",
      detail: exoneration.whatLedToExoneration,
    });
  } else {
    timelineEvents.push({
      year: "Present",
      label: CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status,
    });
  }

  // A generic, status-level description (tied to the enum value, not
  // invented per-case detail) — the real per-case narrative for an
  // exoneration comes from exoneration.whatLedToExoneration below instead.
  const STATUS_DESCRIPTION: Record<string, string> = {
    active_case: "This case is active. Xonorate continues to advocate for a new look at this conviction.",
    awaiting_review: "This case is awaiting formal review by the responsible authority.",
    exonerated: "This case has been resolved — the conviction was vacated.",
  };

  const documentsWithLinks = documents.filter(
    (doc): doc is typeof doc & { fileUrl: string } => Boolean(doc.fileUrl),
  );

  // Only ever lists sections that actually exist for this case — an empty
  // Case Developments or Related Reporting section isn't in the nav at all.
  const navItems: CaseNavItem[] = [
    { href: "#overview", label: "Overview" },
    { href: "#intelligence", label: "Case Intelligence" },
    { href: "#timeline", label: "Timeline" },
    { href: "#stands", label: "Where It Stands" },
    ...(developments.length > 0 ? [{ href: "#developments", label: "Developments" }] : []),
    ...(relatedReporting.length > 0 ? [{ href: "#reporting", label: "Related Reporting" }] : []),
    ...(mainVideo ? [{ href: "#attention", label: "Public Attention" }] : []),
    { href: "#action", label: "Take Action" },
  ];

  const session = await auth();
  let initiallySigned = false;
  if (session?.user && petition) {
    const [ownSignature] = await db
      .select({ verified: signatures.verified })
      .from(signatures)
      .where(
        and(eq(signatures.petitionId, petition.id), eq(signatures.userId, session.user.id)),
      )
      .limit(1);
    initiallySigned = ownSignature?.verified ?? false;
  }

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${caseRow.clientName} — ${CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status}`,
          description: caseRow.summary,
          image: caseRow.photoUrl ? [new URL(caseRow.photoUrl, origin).toString()] : undefined,
          datePublished: caseRow.createdAt.toISOString(),
          dateModified: caseRow.updatedAt.toISOString(),
          author: { "@type": "Organization", name: "Xonorate Media Platform" },
          publisher: { "@type": "Organization", name: "Xonorate Media Platform" },
          mainEntityOfPage: `${origin}/cases/${slug}`,
        }}
      />
      <main id="main-content" className="flex-1 bg-background">
        {/* HEADER — name, headline stat, status, large photo */}
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-14 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-brand uppercase">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status}
              </p>
              <h1 className="mt-2 font-serif text-4xl text-header-foreground sm:text-6xl">
                {caseRow.clientName}
              </h1>
              {!caseRow.isClient && (
                <p className="mt-2 inline-flex items-center border border-header-border px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-header-label uppercase">
                  {SPOTLIGHT_CASE_LABEL}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                {caseRow.timeServed && (
                  <div>
                    <p className="font-serif text-3xl text-brand">{caseRow.timeServed}</p>
                    <p className="text-xs font-semibold tracking-wide text-header-muted uppercase">
                      {exoneration ? "Lost" : "Served so far"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-serif text-xl text-header-foreground">{caseRow.state}</p>
                  <p className="text-xs font-semibold tracking-wide text-header-muted uppercase">
                    {caseRow.county ? `${caseRow.county} County` : "State"}
                  </p>
                </div>
                <div>
                  <p className="font-serif text-xl text-header-foreground">{conviction.charge}</p>
                  <p className="text-xs font-semibold tracking-wide text-header-muted uppercase">
                    Conviction
                  </p>
                </div>
              </div>
            </div>
            <div className="h-48 w-40 shrink-0 overflow-hidden border border-header-border sm:h-56 sm:w-44">
              {caseRow.photoUrl ? (
                <Image
                  src={caseRow.photoUrl}
                  alt={caseRow.clientName}
                  width={320}
                  height={400}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <RedactedPhoto />
              )}
            </div>
          </div>
        </div>

        <CaseNav items={navItems} />

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          <div id="overview" className="scroll-mt-16">
            {innocenceClaim && innocenceClaim.stats.length > 0 && (
              <div className="flex flex-wrap gap-x-10 gap-y-6 border-b border-border pb-8">
                {innocenceClaim.stats.map((stat, i) => (
                  <div key={i}>
                    <p className="font-serif text-3xl text-brand tabular-nums">{stat.value}</p>
                    <p className="mt-1 max-w-36 text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {innocenceClaim?.pullQuote && (
              <blockquote className="mt-8 border-l-2 border-brand pl-4 font-serif text-xl text-foreground italic">
                &ldquo;{innocenceClaim.pullQuote}&rdquo;
              </blockquote>
            )}
          </div>

          {/* CASE INTELLIGENCE — replaces the old document-first
              presentation. Facts, evidence, and open questions, told as an
              investigative briefing rather than a file list; documents
              themselves move to the subtler "Sources & records" section
              near the bottom of the page. */}
          <section id="intelligence" className="mt-12 scroll-mt-16">
            <Eyebrow text="Case intelligence" />
            <h2 className="mt-2 font-serif text-3xl text-foreground">
              The facts, the evidence, the open questions.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              The facts, evidence, developments, and unanswered questions surrounding this case.
            </p>

            {/* THE STORY */}
            <div className="mt-8">
              <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                The story
              </h3>
              <p className="mt-2 whitespace-pre-line text-lg text-foreground">{caseRow.summary}</p>
            </div>

            {/* WHAT WE KNOW — editorial fact strip, not a spreadsheet */}
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                What we know
              </h3>
              <div className="mt-3 flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <p className="text-foreground">{conviction.charge}</p>
                  <p className="text-xs text-muted uppercase">Conviction, {conviction.year}</p>
                </div>
                <div>
                  <p className="text-foreground">{conviction.sentence}</p>
                  <p className="text-xs text-muted uppercase">Sentence</p>
                </div>
                {caseDetailFacts.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-foreground">{value}</p>
                    <p className="text-xs text-muted uppercase">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT RAISES QUESTIONS */}
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                What raises questions
              </h3>
              <p className="mt-2 text-lg text-foreground">{conviction.contributingFactors}</p>
              {contributingFactorTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {contributingFactorTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* THE EVIDENCE — readable summaries, no PDFs required to
                understand what's at issue */}
            {claimCategories.length > 0 && (
              <div className="mt-8 border-t border-border pt-8">
                <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                  The evidence
                </h3>
                <div className="mt-4 space-y-8">
                  {claimCategories.map((category) => (
                    <div key={category.title}>
                      <p className="font-serif text-lg text-foreground">{category.title}</p>
                      <div className="mt-3 space-y-4">
                        {category.items.map((item, i) => (
                          <div key={i} className="border-l-2 border-border pl-4">
                            <p className="font-semibold text-brand">{item.title}</p>
                            <p className="mt-1 text-sm text-foreground">{item.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* THE COST */}
          {hasImpact && impact && (
            <section id="impact" className="mt-12 scroll-mt-20">
              <Eyebrow text="The cost" />
              {impact.stats.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
                  {impact.stats.map((stat, i) => (
                    <div key={i}>
                      <p className="font-serif text-3xl text-brand tabular-nums">{stat.value}</p>
                      <p className="mt-1 max-w-32 text-xs text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {impact.familyImpact && (
                <div className="mt-5">
                  <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                    Impact on family
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">
                    {impact.familyImpact}
                  </p>
                </div>
              )}
              {impact.communityImpact && (
                <div className="mt-5">
                  <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                    Impact on community
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">
                    {impact.communityImpact}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* CASE TIMELINE */}
          <section id="timeline" className="mt-12 scroll-mt-16">
            <Eyebrow text="Case timeline" />
            <ol className="mt-6 border-l-2 border-border pl-6">
              {timelineEvents.map((event, i) => (
                <li key={i} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute top-1 -left-[29px] h-3 w-3 rounded-full bg-brand"
                    aria-hidden
                  />
                  <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">
                    {event.year}
                  </p>
                  <p className="mt-1 font-serif text-xl text-foreground">{event.label}</p>
                  {event.detail && (
                    <p className="mt-1 max-w-lg text-sm text-muted">{event.detail}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* WHERE IT STANDS */}
          <section id="stands" className="mt-12 scroll-mt-16">
            <Eyebrow text="Where it stands" />
            <p
              className={`inline-flex items-center gap-2 font-serif text-3xl uppercase ${
                caseRow.status === "exonerated" ? "text-header-label" : "text-brand"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  caseRow.status === "exonerated" ? "bg-header-label" : "bg-brand"
                }`}
                aria-hidden
              />
              {CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status}
            </p>
            {exoneration ? (
              <p className="mt-3 max-w-lg text-sm text-foreground">
                {exoneration.whatLedToExoneration}
              </p>
            ) : (
              <p className="mt-3 max-w-lg text-sm text-muted">
                {STATUS_DESCRIPTION[caseRow.status]}
              </p>
            )}
          </section>

          {/* CASE DEVELOPMENTS — hidden entirely until at least one exists */}
          {developments.length > 0 && (
            <section id="developments" className="mt-12 scroll-mt-16">
              <Eyebrow text="Case developments" />
              <div className="mt-4 space-y-6">
                {developments.map((update) => (
                  <div key={update.id} className="border-t border-border pt-4">
                    <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">
                      {update.createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 font-serif text-xl text-foreground">{update.headline}</p>
                    <p className="mt-1 text-sm text-muted">{update.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RELATED REPORTING — Newsroom posts tagged to this case; hidden
              until one exists */}
          {relatedReporting.length > 0 && (
            <section id="reporting" className="mt-12 scroll-mt-16">
              <Eyebrow text="Related reporting" />
              <div className="mt-4 space-y-5">
                {relatedReporting.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/news/${post.slug}`}
                    className="group block border-t border-border pt-4"
                  >
                    <p className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                      {PUBLIC_POST_TYPE_LABEL[post.type] ?? post.type} ·{" "}
                      {(post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 font-serif text-xl text-foreground group-hover:text-brand">
                      {post.title}
                    </p>
                    <span className="mt-1 inline-block font-mono text-xs font-bold text-brand uppercase">
                      Read story →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* PUBLIC ATTENTION — top-performing FB/IG clips for this case,
              curated in /admin/cases/[id]/edit. Skipped entirely when no
              video has been added yet, same as every other optional section
              on this page. */}
          {mainVideo && (
            <section id="attention" className="mt-12 scroll-mt-16">
              <Eyebrow text="Public attention" />
              <h2 className="mt-2 font-serif text-3xl text-foreground">
                The story is reaching people.
              </h2>
              <p className="mt-3 max-w-lg text-sm text-muted">
                Every share puts {caseRow.clientName.split(" ")[0]}&apos;s name in front of
                someone new. Here&apos;s how far this clip has traveled since it went up.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-[340px_1fr]">
                <div className="max-w-[340px]">
                  <VideoCard video={mainVideo} ribbon="Top performing" />
                </div>
                <div>
                  <dl className="flex flex-col border-t border-border">
                    <div className="flex items-center justify-between border-b border-border py-3">
                      <dt className="text-sm text-foreground">Views</dt>
                      <dd className="font-mono text-base font-semibold text-foreground tabular-nums">
                        {mainVideo.views.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-3">
                      <dt className="text-sm text-foreground">Likes</dt>
                      <dd className="font-mono text-base font-semibold text-foreground tabular-nums">
                        {mainVideo.likes.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-3">
                      <dt className="text-sm text-foreground">Shares</dt>
                      <dd className="font-mono text-base font-semibold text-foreground tabular-nums">
                        {mainVideo.shares.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-3">
                      <dt className="text-sm text-foreground">Comments</dt>
                      <dd className="font-mono text-base font-semibold text-foreground tabular-nums">
                        {mainVideo.comments.toLocaleString()}
                      </dd>
                    </div>
                    {signersSincePost > 0 && (
                      <div className="flex items-center justify-between py-3">
                        <dt className="text-sm text-foreground">Petition signers since post</dt>
                        <dd className="font-mono text-base font-semibold text-link-strong tabular-nums">
                          +{signersSincePost.toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <a
                    href={mainVideo.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block font-mono text-xs text-link uppercase hover:text-link-strong"
                  >
                    Watch on{" "}
                    {mainVideo.platform === "instagram" ? "Instagram" : "Facebook"} ↗
                  </a>
                </div>
              </div>

              {moreVideos.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                    More clips from this case
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {moreVideos.map((video) => (
                      <VideoCard key={video.id} video={video} size="small" />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAKE ACTION */}
          <section id="action" className="mt-12 scroll-mt-16">
            <Eyebrow text="Take action" />
            {petition ? (
              <div className="mt-4 border border-border bg-muted-background p-5">
                <p className="font-serif text-xl text-foreground">{petition.title}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                  {petition.askText}
                </p>
                <div className="mt-4">
                  <div className="h-2 bg-border">
                    <div
                      className="h-2 bg-brand"
                      style={{
                        width: `${Math.min(100, Math.round((signatureCount / petition.goalCount) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted tabular-nums">
                    {signatureCount.toLocaleString()} of {petition.goalCount.toLocaleString()}{" "}
                    signatures ·{" "}
                    <Link href={`/petitions/${petition.slug}`} className="text-link hover:text-link-strong hover:underline">
                      view petition
                    </Link>
                  </p>
                </div>
                <div className="mt-5">
                  <PetitionSignForm
                    petitionId={petition.id}
                    petitionUrl={`${origin}/petitions/${petition.slug}`}
                    petitionTitle={petition.title}
                    alreadyConfirmed={confirmed === "1"}
                    initiallySigned={initiallySigned}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 border border-dashed border-border p-4 text-sm text-muted">
                No active petition for this case yet.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ShareButtons url={`${origin}/cases/${slug}`} title={caseRow.clientName} />
              <a
                href="https://cash.app/$xonorate"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand px-5 py-2 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
              >
                Support this case
              </a>
            </div>
          </section>

          {/* SOURCES & RECORDS — subtle, secondary, optional. Case
              documents remain fully intact in the database and in
              /admin/cases — this just stops making "view PDF" the primary
              way to understand a case. Hidden entirely when there's
              nothing publicly linkable to show. */}
          {(documentsWithLinks.length > 0 || caseRow.sourceUrl) && (
            <section className="mt-16 border-t border-border pt-8">
              <Eyebrow text="Sources & records" />
              <p className="mt-2 max-w-lg text-xs text-muted">
                Case information presented by Xonorate is based on available court records, case
                materials, reporting, and other documented sources.
              </p>
              <ul className="mt-4 space-y-2">
                {caseRow.sourceUrl && (
                  <li>
                    <a
                      href={caseRow.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-link uppercase hover:text-link-strong"
                    >
                      National Registry of Exonerations ↗
                    </a>
                  </li>
                )}
                {documentsWithLinks.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-link uppercase hover:text-link-strong"
                    >
                      {doc.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {moreCases.length > 0 && (
            <section className="mt-16 border-t border-border pt-8">
              <Eyebrow text="More cases" />
              <div className="mt-4 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
                {moreCases.map((c) => {
                  const cConviction = c.convictionDetails as ConvictionDetails;
                  const cExonerated = c.status === "exonerated";
                  const cYears = c.timeServed?.split("(")[0].trim();
                  return (
                    <Link
                      key={c.id}
                      href={`/cases/${c.slug}`}
                      className="group flex flex-col bg-background p-5 transition hover:bg-muted-background"
                    >
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 font-mono text-[10px] font-bold tracking-wide uppercase ${
                          cExonerated ? "text-label" : "text-brand"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${cExonerated ? "bg-label" : "bg-brand"}`}
                          aria-hidden
                        />
                        {CASE_STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      <p className="mt-2 font-serif text-xl text-foreground">{c.clientName}</p>
                      {cYears && (
                        <p className="mt-1 font-mono text-lg font-bold text-brand tabular-nums">
                          {cYears}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[10.5px] tracking-wide text-muted uppercase">
                        {c.state} · {cConviction.charge}
                      </p>
                      <span className="mt-3 font-mono text-[10.5px] font-bold text-foreground uppercase group-hover:text-brand">
                        View case →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <CommentSection targetType="case" targetId={caseRow.id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
