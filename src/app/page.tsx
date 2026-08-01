import { and, count, desc, eq, gte } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { SealMark } from "@/components/seal-mark";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, posts, signatures } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { excerptFromMarkdown } from "@/lib/markdown";
import { getPlatformStats } from "@/lib/platform-stats";
import { POST_TYPE_LABEL } from "@/lib/post-type";

const FEED_LIMIT = 3;

// Sourced from the National Registry of Exonerations (exonerationregistry.org):
// 3,478 exonerations logged through the end of 2023, plus 147 more in 2024
// (avg. 13.5 years lost each) — https://www.law.umich.edu/special/exoneration.
const WRONGFUL_CONVICTION_STATS = [
  { value: "3,600+", label: "Exonerations recorded in the U.S. since 1989" },
  {
    value: "27,000+",
    label: "Years collectively lost to wrongful imprisonment",
  },
  {
    value: "147",
    label: "People exonerated in 2024 alone, averaging 13.5 years lost each",
  },
];

// Share of Innocence Project client cases (n=257) involving each factor —
// https://innocenceproject.org/exonerations-data/. Cases often involve more
// than one cause, so the shares don't sum to 100%.
const WRONGFUL_CONVICTION_CAUSES = [
  { label: "Eyewitness misidentification", value: 62 },
  { label: "Misapplied forensic science", value: 52 },
  { label: "False confessions", value: 29 },
  { label: "Informant testimony", value: 19 },
];

// Signature counts and freshly published content must always be fresh —
// never statically prerendered.
export const dynamic = "force-dynamic";

export default async function Home() {
  const recentCases = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      status: cases.status,
      state: cases.state,
      photoUrl: cases.photoUrl,
    })
    .from(cases)
    .orderBy(desc(cases.createdAt))
    .limit(FEED_LIMIT);

  const recentPetitions = await db
    .select({
      id: petitions.id,
      title: petitions.title,
      slug: petitions.slug,
      goalCount: petitions.goalCount,
      startingSignatureCount: petitions.startingSignatureCount,
      recipientName: petitions.recipientName,
      caseClientName: cases.clientName,
    })
    .from(petitions)
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .where(eq(petitions.status, "published"))
    .orderBy(desc(petitions.createdAt))
    .limit(FEED_LIMIT);

  const signatureCounts = await Promise.all(
    recentPetitions.map((p) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(
          and(eq(signatures.petitionId, p.id), eq(signatures.verified, true)),
        )
        .then(([r]) => (r?.value ?? 0) + p.startingSignatureCount),
    ),
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const signedThisWeekCounts = await Promise.all(
    recentPetitions.map((p) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(
          and(
            eq(signatures.petitionId, p.id),
            eq(signatures.verified, true),
            gte(signatures.createdAt, sevenDaysAgo),
          ),
        )
        .then(([r]) => r?.value ?? 0),
    ),
  );

  const recentPosts = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      imageUrl: posts.imageUrl,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(FEED_LIMIT);

  const platformStats = await getPlatformStats();

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="relative mx-auto h-0 w-full max-w-3xl">
        <SealMark className="pointer-events-none absolute top-[70px] left-3 h-[130px] w-[180px] text-brand opacity-[0.14] sm:top-[62px] sm:left-6 sm:h-[320px] sm:w-[440px]" />
      </div>

      <SiteHeader />
      <main className="relative flex-1">
        <section className="mx-auto w-full max-w-3xl px-6 pt-16 text-center">
          <h1 className="font-serif text-4xl text-foreground">
            Xonorate Media Platform
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Advocating for the wrongfully convicted — client cases, live
            petitions, and daily advocacy news.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/petitions"
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
            >
              View petitions
            </Link>
            <Link
              href="/submit-inquiry"
              className="text-sm text-muted underline transition hover:text-foreground"
            >
              Submit an inquiry
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="wrongful-conviction-heading"
          className="mt-14 bg-brand"
        >
          <div className="mx-auto w-full max-w-4xl px-6 py-14">
            <p className="text-center text-xs font-semibold tracking-widest text-accent uppercase">
              Why this work matters
            </p>
            <h2
              id="wrongful-conviction-heading"
              className="mx-auto mt-2 max-w-xl text-center font-serif text-3xl text-brand-foreground"
            >
              Wrongful conviction isn&apos;t rare. It&apos;s systemic.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-brand-foreground/75">
              Every case below is a person who already served time for something
              they didn&apos;t do. That&apos;s exactly why Xonorate exists — to
              put a name and a face on the numbers, and keep pushing until the
              record is corrected.
            </p>

            <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {WRONGFUL_CONVICTION_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-sans text-4xl font-semibold text-brand-foreground">
                    {stat.value}
                  </dd>
                  <p className="mt-1.5 text-sm text-brand-foreground/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-white/15 pt-10">
              <h3 className="text-center font-serif text-lg text-brand-foreground">
                Leading causes of wrongful conviction
              </h3>
              <p className="mx-auto mt-1 max-w-md text-center text-xs text-brand-foreground/60">
                Share of Innocence Project client cases involving each factor.
                Most wrongful convictions involve more than one.
              </p>

              <div className="mx-auto mt-8 max-w-md">
                {WRONGFUL_CONVICTION_CAUSES.map((cause) => (
                  <div key={cause.label} className="mt-5 first:mt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-brand-foreground/90">
                        {cause.label}
                      </span>
                      <span className="font-sans text-sm font-semibold text-brand-foreground">
                        {cause.value}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-r-[4px] bg-white/15">
                      <div
                        className="h-2 rounded-r-[4px] bg-accent"
                        style={{ width: `${cause.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/15 pt-10 sm:flex-row sm:justify-between sm:gap-6">
              <p className="text-xs text-brand-foreground/60">
                Sources:{" "}
                <a
                  href="https://exonerationregistry.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:text-brand-foreground"
                >
                  National Registry of Exonerations
                </a>
                {" · "}
                <a
                  href="https://innocenceproject.org/exonerations-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline hover:text-brand-foreground"
                >
                  Innocence Project
                </a>
              </p>
              <Link
                href="/cases"
                className="shrink-0 rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
              >
                See who we&apos;re fighting for
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-6 pt-14 pb-16">
          {platformStats.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-foreground">Our impact so far</h2>
              <p className="mt-1 text-sm text-muted">
                Counted live from our own case files — not a national estimate.
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {platformStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border p-5 text-center shadow-sm"
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd
                      className={`font-serif text-brand ${
                        stat.value.length > 10
                          ? "text-xl"
                          : stat.value.length > 6
                            ? "text-2xl"
                            : "text-3xl"
                      }`}
                    >
                      {stat.value}
                    </dd>
                    <p className="mt-1.5 text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {recentCases.length > 0 && (
            <section className="mt-20">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">Cases</h2>
                <Link href="/cases" className="text-sm text-brand underline">
                  View all cases
                </Link>
              </div>
              <ul className="mt-5 space-y-4">
                {recentCases.map((row) => (
                  <li
                    key={row.id}
                    className="flex gap-4 rounded-lg border border-border p-5 shadow-sm transition hover:shadow-md"
                  >
                    {row.photoUrl && (
                      <Image
                        src={row.photoUrl}
                        alt={row.clientName}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                        unoptimized
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        {CASE_STATUS_LABEL[row.status] ?? row.status} ·{" "}
                        {row.state}
                      </p>
                      <Link
                        href={`/cases/${row.slug}`}
                        className="mt-1 block font-serif text-lg text-foreground hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentPetitions.length > 0 && (
            <section className="mt-14">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">
                  Active petitions
                </h2>
                <Link
                  href="/petitions"
                  className="text-sm text-brand underline"
                >
                  View all petitions
                </Link>
              </div>
              <ul className="mt-5 space-y-4">
                {recentPetitions.map((row, i) => {
                  const signatureCount = signatureCounts[i] ?? 0;
                  const pct = Math.min(
                    100,
                    Math.round((signatureCount / row.goalCount) * 100),
                  );
                  const signedThisWeek = signedThisWeekCounts[i] ?? 0;
                  return (
                    <li
                      key={row.id}
                      className="rounded-lg border border-border border-l-4 border-l-brand p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        {row.caseClientName && (
                          <p className="text-xs font-medium uppercase tracking-wide text-brand">
                            For {row.caseClientName}
                          </p>
                        )}
                        <Link
                          href={`/petitions/${row.slug}`}
                          className="mt-1 block font-serif text-lg text-foreground hover:underline"
                        >
                          {row.title}
                        </Link>
                        {row.recipientName && (
                          <span className="mt-2 inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand">
                            Addressed to {row.recipientName}
                          </span>
                        )}
                        <div className="mt-3">
                          <div className="h-2 rounded-full bg-muted-background">
                            <div
                              className="h-2 rounded-full bg-brand"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {signatureCount.toLocaleString()} of{" "}
                            {row.goalCount.toLocaleString()} signatures
                            {signedThisWeek > 0 && (
                              <>
                                {" · "}
                                <span className="text-brand">
                                  {signedThisWeek.toLocaleString()} signed this week
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {recentPosts.length > 0 && (
            <section className="mt-14">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">
                  Latest updates
                </h2>
                <Link href="/posts" className="text-sm text-brand underline">
                  View all updates
                </Link>
              </div>
              <ul className="mt-5 space-y-4">
                {recentPosts.map((row) => (
                  <li
                    key={row.id}
                    className="flex gap-4 rounded-lg border border-border p-5 shadow-sm transition hover:shadow-md"
                  >
                    {row.imageUrl && (
                      <div className="relative w-32 shrink-0 self-stretch overflow-hidden rounded-lg ring-1 ring-border/70">
                        <Image
                          src={row.imageUrl}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        {POST_TYPE_LABEL[row.type] ?? row.type}
                        {row.publishedAt && (
                          <>
                            {" · "}
                            {row.publishedAt.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </>
                        )}
                      </p>
                      <Link
                        href={`/posts/${row.slug}`}
                        className="mt-1 line-clamp-2 font-serif text-lg text-foreground hover:underline"
                      >
                        {row.title}
                      </Link>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {excerptFromMarkdown(row.body)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
