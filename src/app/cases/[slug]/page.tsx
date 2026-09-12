import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/auth";
import { CommentSection } from "@/components/comment-section";
import { JsonLd } from "@/components/json-ld";
import { PetitionSignForm } from "@/components/petition-sign-form";
import { RedactedPhoto } from "@/components/redacted-photo";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasImpactContent, type CaseImpact } from "@/lib/case-impact";
import { db } from "@/db";
import { caseDocuments, caseSlugHistory, cases, petitions, signatures } from "@/db/schema";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";
import type { InnocenceClaim } from "@/lib/innocence-claim";
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

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
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

          {/* THE CASE */}
          <section className="mt-12">
            <p className="text-xs font-bold tracking-widest text-brand uppercase">The case</p>
            <p className="mt-3 whitespace-pre-line text-lg text-foreground">{caseRow.summary}</p>

            {caseDetailFacts.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border border-border p-5 text-sm sm:grid-cols-3">
                {caseDetailFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <dl className="mt-6 space-y-3 text-sm">
              <div className="border-b border-border pb-3">
                <dt className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                  Sentence
                </dt>
                <dd className="mt-0.5 text-foreground">{conviction.sentence}</dd>
              </div>
              {caseRow.sourceUrl && (
                <div>
                  <a
                    href={caseRow.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-mono text-xs text-link uppercase hover:text-link-strong"
                  >
                    Source: National Registry of Exonerations ↗
                  </a>
                </div>
              )}
            </dl>
          </section>

          {/* WHY IT MATTERS — the systemic failure behind this conviction */}
          <section className="mt-12">
            <p className="text-xs font-bold tracking-widest text-brand uppercase">
              Why it matters
            </p>
            <p className="mt-3 text-lg text-foreground">{conviction.contributingFactors}</p>
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
          </section>

          {/* THE EVIDENCE */}
          {claimCategories.length > 0 && (
            <section className="mt-12">
              <p className="text-xs font-bold tracking-widest text-brand uppercase">
                The evidence
              </p>
              <div className="mt-4 space-y-8">
                {claimCategories.map((category) => (
                  <div key={category.title}>
                    <h3 className="font-serif text-lg text-foreground">{category.title}</h3>
                    <ol className="mt-3 space-y-5">
                      {category.items.map((item, i) => (
                        <li key={i} className="border-l-2 border-border pl-4">
                          <p className="font-semibold text-brand">
                            {i + 1}. {item.title}
                          </p>
                          <p className="mt-1 text-sm text-foreground">{item.body}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* THE COST */}
          {hasImpact && impact && (
            <section id="impact" className="mt-12 scroll-mt-20">
              <p className="text-xs font-bold tracking-widest text-brand uppercase">The cost</p>
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
          <section className="mt-12">
            <p className="text-xs font-bold tracking-widest text-brand uppercase">
              Case timeline
            </p>
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

          {/* DOCUMENTS */}
          <section className="mt-12">
            <p className="text-xs font-bold tracking-widest text-brand uppercase">Documents</p>
            {documents.length === 0 ? (
              <p className="mt-3 border border-dashed border-border p-4 text-sm text-muted">
                No documents listed yet.
              </p>
            ) : (
              <table className="mt-3 w-full text-left text-sm">
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-border">
                      <td className="py-2 text-foreground">
                        {doc.fileUrl ? (
                          <a href={doc.fileUrl} className="text-link hover:text-link-strong hover:underline">
                            {doc.title}
                          </a>
                        ) : (
                          doc.title
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            doc.status === "on_file"
                              ? "inline-flex items-center border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase"
                              : "inline-flex items-center border border-border px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-label uppercase"
                          }
                        >
                          {doc.status === "on_file" ? "On file" : "Needed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* WHAT XONORATE IS ASKING */}
          <section className="mt-12">
            <p className="text-xs font-bold tracking-widest text-brand uppercase">
              What Xonorate is asking
            </p>
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

          <CommentSection targetType="case" targetId={caseRow.id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
