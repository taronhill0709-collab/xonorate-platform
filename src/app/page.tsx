import { asc, count, desc, eq, ne } from "drizzle-orm";
import {
  ArrowRight,
  Clock,
  FileText,
  Heart,
  Megaphone,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RedactedPhoto } from "@/components/redacted-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, posts, siteSettings } from "@/db/schema";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";
import { getFounderCase } from "@/lib/founder";
import {
  WRONGFUL_CONVICTION_CAUSES,
  WRONGFUL_CONVICTION_STATS,
} from "@/lib/national-exoneration-stats";
import { PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";
import { getPlatformStats } from "@/lib/platform-stats";

const NEWSROOM_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type ConvictionDetails = { charge: string; year: number };
type ExonerationDetails = { whatLedToExoneration: string; year: number } | null;

const EXONERATED_FEED_LIMIT = 3;

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
      convictionDetails: cases.convictionDetails,
      timeServed: cases.timeServed,
      isClient: cases.isClient,
    })
    .from(cases)
    .where(ne(cases.status, "exonerated"))
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt))
    .limit(3);

  const featuredCases = recentCases.map((c) => ({
    id: c.id,
    slug: c.slug,
    clientName: c.clientName,
    state: c.state,
    status: c.status,
    photoUrl: c.photoUrl,
    charge: (c.convictionDetails as ConvictionDetails).charge,
    timeServed: c.timeServed,
    isClient: c.isClient,
  }));

  const recentlyExonerated = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      summary: cases.summary,
      state: cases.state,
      photoUrl: cases.photoUrl,
      isClient: cases.isClient,
      convictionDetails: cases.convictionDetails,
      exonerationDetails: cases.exonerationDetails,
      timeServed: cases.timeServed,
    })
    .from(cases)
    .where(eq(cases.status, "exonerated"))
    .orderBy(asc(cases.sortOrder), desc(cases.updatedAt))
    .limit(EXONERATED_FEED_LIMIT);

  const [{ value: activeCaseCount }] = await db
    .select({ value: count() })
    .from(cases)
    .where(ne(cases.status, "exonerated"));

  const latestPosts = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      imageUrl: posts.imageUrl,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.sortOrder), desc(posts.createdAt))
    .limit(4);

  const platformStats = await getPlatformStats();
  const founderCase = await getFounderCase();
  const [settings] = await db
    .select({ heroImageUrl: siteSettings.heroImageUrl })
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"))
    .limit(1);

  // The homepage impact bar mixes two kinds of numbers, kept honest by
  // sourcing: the first two are cited national estimates (see
  // national-exoneration-stats.ts), the last two are counted live from
  // Xonorate's own database — never a placeholder or a round guess.
  const signaturesStat = platformStats.find(
    (s) => s.label === "Petition signatures collected",
  );
  const impactStats = [
    { icon: Users, value: WRONGFUL_CONVICTION_STATS[0].value, label: "Exonerations nationwide" },
    { icon: Clock, value: WRONGFUL_CONVICTION_STATS[1].value, label: "Years lost to wrongful convictions" },
    {
      icon: FileText,
      value: signaturesStat?.value ?? "0",
      label: "Petition signatures",
    },
    {
      icon: Megaphone,
      value: activeCaseCount.toLocaleString(),
      label: activeCaseCount === 1 ? "Active case" : "Active cases",
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" className="relative flex-1">
        {/* SECTION 01 — HERO. Full-bleed documentary photograph (or a plain
            dark field when no hero image has been set in /admin/settings)
            under a dark gradient, headline anchored to the bottom like an
            opening title card. */}
        <section className="relative overflow-hidden bg-header-background">
          <div className="absolute inset-0">
            <Image
              src={settings?.heroImageUrl || "/images/hero-courthouse.png"}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-60"
              // Admin-uploaded hero photos come from an arbitrary external
              // URL (case-photo-storage), so those skip Next's optimizer;
              // the bundled default is a local asset and gets fully
              // optimized (responsive sizes, modern formats).
              unoptimized={Boolean(settings?.heroImageUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-header-background via-header-background/60 to-header-background/30" />
          </div>
          <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col justify-end px-6 pt-32 pb-16 sm:pb-20">
            <p className="text-xs font-bold tracking-[0.25em] text-brand uppercase">
              Wrongful convictions. Exposed.
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-[2.75rem] leading-[0.95] text-header-foreground sm:text-[4.25rem] lg:text-[5.25rem]">
              When the system gets it wrong,{" "}
              <span className="text-header-muted">we make sure</span> the
              world knows.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-header-muted">
              Xonorate is a media and advocacy platform exposing wrongful
              convictions, amplifying overlooked cases, and mobilizing people
              for real change.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 bg-brand px-7 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition hover:bg-accent"
              >
                Explore cases <ArrowRight size={16} />
              </Link>
              <Link
                href="/take-action"
                className="border border-header-foreground/30 px-7 py-3 text-sm font-bold tracking-wide text-header-foreground uppercase transition hover:border-header-foreground"
              >
                Take action
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 02 — IMPACT STATISTICS. Two cited national figures beside
            two live counts from Xonorate's own database — never a
            dashboard, just large numerals over a hairline rule. */}
        <section className="border-t border-b border-header-border bg-header-background">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-y divide-header-border px-6 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {impactStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 py-6 sm:justify-center sm:px-6">
                <stat.icon className="h-6 w-6 shrink-0 text-header-muted" aria-hidden strokeWidth={1.5} />
                <div>
                  <dd className="font-serif text-2xl text-header-foreground tabular-nums sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dt className="mt-0.5 text-[11px] font-semibold tracking-wide text-header-muted uppercase">
                    {stat.label}
                  </dt>
                </div>
              </div>
            ))}
          </div>
        </section>

        {founderCase && (
          <section className="border-t border-header-border bg-header-background/60 py-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
              {founderCase.photoUrl ? (
                <Image
                  src={founderCase.photoUrl}
                  alt={founderCase.clientName}
                  width={160}
                  height={160}
                  className="h-32 w-32 shrink-0 object-cover ring-4 ring-brand/40 sm:h-40 sm:w-40"
                  unoptimized
                />
              ) : (
                <div className="flex h-32 w-32 shrink-0 items-center justify-center bg-muted-background ring-4 ring-brand/40 sm:h-40 sm:w-40">
                  <span className="font-serif text-3xl text-header-muted">
                    {founderCase.clientName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-brand uppercase">
                  <ShieldCheck size={14} />
                  Our founder
                </p>
                <p className="mt-2 max-w-2xl text-sm text-header-muted">
                  <strong className="font-semibold text-header-foreground">
                    {founderCase.clientName}
                  </strong>{" "}
                  spent 16 years in a New Jersey prison for a double homicide he
                  didn&apos;t commit. He was exonerated in 2021 after the
                  state&apos;s Conviction Review Unit found he never should have
                  been convicted in the first place — and walked out having
                  learned firsthand how long a wrongful conviction can sit
                  unexamined, and what it actually takes to get one looked at
                  again. He founded Xonorate so other wrongfully convicted
                  people don&apos;t have to wait 16 years for someone to
                  listen.
                </p>
                <Link
                  href={`/cases/${founderCase.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                >
                  Read his story →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 03 — FEATURED CASES. Editorial dossier cards: full-bleed
            photography with the name/status overlaid on a dark gradient
            (documentary-title treatment), a data strip below — no rounded
            corners, no generic card padding. */}
        <section className="border-t border-header-border bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                  Featured cases
                </p>
                <h2 className="mt-2 font-serif text-3xl text-header-foreground sm:text-4xl">
                  Real people. Real cases. Real change.
                </h2>
              </div>
              <Link
                href="/cases"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold tracking-wide text-header-muted uppercase transition hover:text-header-foreground sm:flex"
              >
                View all cases <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {featuredCases.map((c, i) => {
                // A handful of timeServed values are long attorney-entered
                // narratives with a parenthetical aside — truncate to the
                // short headline figure for this card's big numeral; the
                // case page itself still has the full detail.
                const timeServedHeadline = c.timeServed?.split("(")[0].trim();
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.slug}`}
                    className="group flex border border-header-border"
                  >
                    <div className="relative aspect-3/4 w-2/5 shrink-0 overflow-hidden">
                      {c.photoUrl ? (
                        <Image
                          src={c.photoUrl}
                          alt={c.clientName}
                          fill
                          sizes="(min-width: 1024px) 15vw, 40vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <RedactedPhoto seed={i} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-1 p-5">
                      <p className="font-serif text-xl text-header-foreground">{c.clientName}</p>
                      {timeServedHeadline && (
                        <p className="font-serif text-2xl text-header-foreground">
                          {timeServedHeadline}
                        </p>
                      )}
                      <p className="text-xs font-semibold tracking-wide text-header-muted uppercase">
                        {c.state} · {c.charge}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-brand uppercase">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                        {CASE_STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      <span className="mt-3 inline-block w-fit border border-header-border px-3 py-1.5 text-xs font-bold tracking-wide text-header-foreground uppercase transition group-hover:border-brand">
                        View case →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 flex flex-col items-start justify-between gap-4 border border-header-border bg-header-border/20 p-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-serif text-xl text-header-foreground">
                  Know someone wrongfully convicted?
                </h3>
                <p className="mt-1 text-sm text-header-muted">
                  Submitting a case is the first step toward review.
                </p>
              </div>
              <Link
                href="/submit-case"
                className="inline-flex w-fit shrink-0 items-center gap-1 bg-brand px-5 py-2.5 text-xs font-bold tracking-wide text-brand-foreground uppercase transition hover:bg-accent"
              >
                Submit a case →
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 04 — XONORATE NEWSROOM. Only renders once at least one
            post has actually been published from /admin/posts — no
            placeholder stories. */}
        {latestPosts.length > 0 && (
          <section className="border-t border-header-border bg-header-background py-16">
            <div className="mx-auto w-full max-w-6xl px-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                    Xonorate newsroom
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-header-foreground sm:text-4xl">
                    Investigate. Inform. Empower.
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="hidden shrink-0 items-center gap-1 text-sm font-semibold tracking-wide text-header-muted uppercase transition hover:text-header-foreground sm:flex"
                >
                  View newsroom <ArrowRight size={14} />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {latestPosts.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`} className="group flex flex-col">
                    <div className="relative aspect-4/3 w-full overflow-hidden">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-muted-background" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 pt-3">
                      <p className="text-[11px] font-semibold tracking-wide text-header-muted uppercase">
                        {PUBLIC_POST_TYPE_LABEL[post.type] ?? post.type}
                      </p>
                      <p className="line-clamp-3 font-serif text-lg text-header-foreground">
                        {post.title}
                      </p>
                      <p className="mt-auto font-mono text-[11px] text-header-muted uppercase">
                        {NEWSROOM_DATE_FORMAT.format(post.publishedAt ?? post.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sourced national context on why this work matters — kept as its
            own dark "exhibit" band rather than the light-paper break the
            previous design used, so the all-dark foundation holds through
            the whole page. */}
        <section aria-labelledby="wrongful-conviction-heading" className="border-t border-header-border bg-band-background">
          <div className="mx-auto w-full max-w-4xl px-6 py-16">
            <p className="text-center text-xs font-semibold tracking-widest text-band-accent uppercase">
              Why this work matters
            </p>
            <h2
              id="wrongful-conviction-heading"
              className="mx-auto mt-2 max-w-xl text-center font-serif text-3xl text-band-foreground"
            >
              Wrongful conviction isn&apos;t rare. It&apos;s systemic.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-header-muted">
              Every case below is a person convicted — many still incarcerated
              today — on evidence that doesn&apos;t hold up to serious
              scrutiny. That&apos;s exactly why Xonorate exists: to put a name
              and a face on the numbers, and keep pushing until each case gets
              the review it deserves.
            </p>

            <dl className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
              {WRONGFUL_CONVICTION_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-7 w-7 text-brand" aria-hidden />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="mt-3 font-serif text-5xl text-band-foreground tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="mx-auto mt-3 max-w-[22ch] text-base font-semibold text-header-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-header-border pt-10">
              <h3 className="text-center font-serif text-lg text-band-foreground">
                Leading causes of wrongful conviction
              </h3>
              <p className="mx-auto mt-1 max-w-md text-center text-xs text-header-muted">
                Share of Innocence Project client cases involving each factor.
                Most wrongful convictions involve more than one.
              </p>

              <div className="mx-auto mt-8 max-w-md">
                {WRONGFUL_CONVICTION_CAUSES.map((cause) => (
                  <div key={cause.label} className="mt-5 first:mt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-header-muted">{cause.label}</span>
                      <span className="font-sans text-sm font-semibold text-band-foreground">
                        {cause.value}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full bg-header-border">
                      <div
                        className="h-2 bg-brand"
                        style={{ width: `${cause.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-header-border pt-10 sm:flex-row sm:justify-between sm:gap-6">
              <p className="font-mono text-xs tracking-wide text-header-muted uppercase">
                Sources —{" "}
                <a
                  href="https://exonerationregistry.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-link normal-case underline decoration-current underline-offset-2 hover:text-link-strong"
                >
                  National Registry of Exonerations
                </a>
                {" · "}
                <a
                  href="https://innocenceproject.org/exonerations-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-link normal-case underline decoration-current underline-offset-2 hover:text-link-strong"
                >
                  Innocence Project
                </a>
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-4">
                <Link
                  href="/impact"
                  className="text-sm font-semibold tracking-wide text-header-foreground uppercase underline hover:text-brand"
                >
                  See the human cost
                </Link>
                <Link
                  href="/cases"
                  className="bg-brand px-5 py-2 text-sm font-bold tracking-wide text-brand-foreground uppercase transition hover:bg-accent"
                >
                  See who we&apos;re fighting for
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 05 — TAKE ACTION */}
        <section className="border-t border-header-border bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">Take action</p>
            <h2 className="mt-2 font-serif text-3xl text-header-foreground sm:text-4xl">
              You can help change a case.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/take-action" className="border border-header-border p-6 transition hover:border-brand/50">
                <FileText className="h-7 w-7 text-brand" aria-hidden strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-lg text-header-foreground">Sign a petition</h3>
                <p className="mt-1 text-sm text-header-muted">Add your voice.</p>
              </Link>
              <Link href="/take-action" className="border border-header-border p-6 transition hover:border-brand/50">
                <Share2 className="h-7 w-7 text-brand" aria-hidden strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-lg text-header-foreground">Share a case</h3>
                <p className="mt-1 text-sm text-header-muted">
                  Put the story in front of more people.
                </p>
              </Link>
              <Link href="/submit-case" className="border border-header-border p-6 transition hover:border-brand/50">
                <Users className="h-7 w-7 text-brand" aria-hidden strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-lg text-header-foreground">Submit a case</h3>
                <p className="mt-1 text-sm text-header-muted">
                  Tell us about a potential wrongful conviction.
                </p>
              </Link>
              <a
                href="https://cash.app/$xonorate"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-header-border p-6 transition hover:border-brand/50"
              >
                <Heart className="h-7 w-7 text-brand" aria-hidden strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-lg text-header-foreground">Support the fight</h3>
                <p className="mt-1 text-sm text-header-muted">
                  Help fund investigative and advocacy work.
                </p>
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-header-border bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                  Justice restored
                </p>
                <h2 className="mt-2 font-serif text-3xl text-header-foreground sm:text-4xl">
                  Exonerated
                </h2>
              </div>
              <Link
                href="/exonerated"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold tracking-wide text-header-muted uppercase transition hover:text-header-foreground sm:flex"
              >
                View all exonerated <ArrowRight size={14} />
              </Link>
            </div>

            {recentlyExonerated.length === 0 ? (
              <p className="mt-8 text-sm text-header-muted">
                Check back soon for exonerations.
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {recentlyExonerated.map((row, i) => {
                  const conviction = row.convictionDetails as ConvictionDetails;
                  const exoneration = row.exonerationDetails as ExonerationDetails;
                  const teaser = exoneration?.whatLedToExoneration || row.summary;
                  // Prefer the attorney-entered time-served figure over the
                  // conviction→exoneration year gap — the year math misses
                  // pretrial detention (e.g. Taron Hill spent ~2 years in
                  // county jail awaiting trial before his conviction year),
                  // so it understates the real total.
                  const yearsLostFallback =
                    exoneration?.year && conviction.year
                      ? exoneration.year - conviction.year
                      : null;
                  return (
                    <Link
                      key={row.id}
                      href={`/cases/${row.slug}`}
                      className="group flex flex-col border border-header-border"
                    >
                      <div className="relative aspect-4/3 w-full overflow-hidden">
                        {row.photoUrl ? (
                          <Image
                            src={row.photoUrl}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <RedactedPhoto seed={i + 1} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-brand uppercase">
                            Exonerated
                            {!row.isClient && (
                              <span className="text-header-label normal-case">
                                {SPOTLIGHT_CASE_LABEL}
                              </span>
                            )}
                          </span>
                          <p className="mt-1.5 line-clamp-2 font-serif text-xl text-white">
                            {row.clientName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 bg-muted-background px-4 py-3">
                        <p className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                          {row.state}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted">{teaser}</p>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          {row.timeServed ? (
                            <span className="font-semibold text-brand">{row.timeServed} lost</span>
                          ) : yearsLostFallback != null && yearsLostFallback > 0 ? (
                            <span className="font-semibold text-brand">
                              {yearsLostFallback} year{yearsLostFallback === 1 ? "" : "s"} lost
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="font-bold text-brand uppercase">Read the case →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {platformStats.length > 0 && (
          <section className="border-t border-header-border bg-header-background py-16">
            <div className="mx-auto w-full max-w-3xl px-6">
              <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">
                Our own record
              </p>
              <h2 className="mt-2 font-serif text-2xl text-header-foreground">
                Our impact so far
              </h2>
              <p className="mt-1 text-sm text-header-muted">
                Counted live from our own case files — not a national estimate.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {platformStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-header-border bg-muted-background p-5 text-center"
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd
                      className={`font-serif font-extrabold tracking-tight text-brand tabular-nums ${
                        stat.value.length > 10
                          ? "text-xl"
                          : stat.value.length > 6
                            ? "text-2xl"
                            : "text-3xl"
                      }`}
                    >
                      {stat.value}
                    </dd>
                    <p className="mt-1.5 text-xs text-header-muted">{stat.label}</p>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* SECTION 06 — MISSION / BRAND STATEMENT */}
        <section className="border-t border-header-border bg-header-background py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl text-header-foreground sm:text-3xl">
                A more just tomorrow is possible.
              </h2>
              <p className="mt-1 text-header-muted">
                Together, we can expose the truth, restore lives, and hold
                the system accountable.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center gap-2 bg-brand px-6 py-3 text-sm font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
            >
              Join the movement <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
