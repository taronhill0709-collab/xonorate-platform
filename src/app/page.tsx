import { asc, desc, eq, ne } from "drizzle-orm";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RedactedPhoto } from "@/components/redacted-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";
import { getFounderCase } from "@/lib/founder";
import {
  WRONGFUL_CONVICTION_CAUSES,
  WRONGFUL_CONVICTION_STATS,
} from "@/lib/national-exoneration-stats";
import { getPlatformStats } from "@/lib/platform-stats";

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
    convictedYear: (c.convictionDetails as ConvictionDetails).year,
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
    })
    .from(cases)
    .where(eq(cases.status, "exonerated"))
    .orderBy(asc(cases.sortOrder), desc(cases.updatedAt))
    .limit(EXONERATED_FEED_LIMIT);

  const platformStats = await getPlatformStats();
  const founderCase = await getFounderCase();

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="relative flex-1">
        <section className="relative overflow-hidden bg-header-background">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-[1.15fr_0.85fr] sm:items-center sm:gap-16 sm:py-24">
            <div>
              <p className="text-xs font-semibold tracking-widest text-brand uppercase">
                Xonorate Media Platform
              </p>
              <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-5xl">
                We expose injustice. We amplify the{" "}
                <span className="text-brand">innocent</span>.
              </h1>
              <p className="mt-5 max-w-md text-header-muted">
                Advocating for the wrongfully convicted — client cases, live
                petitions, and stories of exoneration.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/cases"
                  className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
                >
                  Explore cases →
                </Link>
                <Link
                  href="/petitions"
                  className="rounded-md border border-header-border px-5 py-2 text-sm font-medium text-header-foreground transition hover:border-header-muted"
                >
                  View petitions
                </Link>
              </div>
            </div>
            <div className="aspect-4/5 w-full overflow-hidden rounded-lg border border-header-border sm:aspect-3/4">
              <RedactedPhoto />
            </div>
          </div>
        </section>

        {founderCase && (
          <section className="border-t border-header-border bg-header-background/60 py-8">
            <div className="mx-auto w-full max-w-6xl px-6">
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-brand uppercase">
                <ShieldCheck size={14} />
                Our founder
              </p>
              <p className="max-w-3xl text-sm text-header-muted">
                <strong className="font-semibold text-header-foreground">
                  {founderCase.clientName} spent 16 years in prison for a crime he didn&apos;t
                  commit.
                </strong>{" "}
                Exonerated in 2021 after New Jersey&apos;s Conviction Review Unit found he never
                should have been convicted, he founded Xonorate so other wrongfully convicted
                people don&apos;t wait 16 years for someone to listen.{" "}
                <Link
                  href={`/cases/${founderCase.slug}`}
                  className="font-semibold whitespace-nowrap text-brand hover:underline"
                >
                  Read his story →
                </Link>
              </p>
            </div>
          </section>
        )}

        {/* The one deliberate light-paper section on an otherwise dark
            site — an "exhibit" moment for the sourced data. Colors are
            hand-coded here rather than pulled from the shared band-*
            tokens, since those tokens are also used for dark-context
            accents elsewhere (carousel badges, toasts) that must stay
            light-on-dark. */}
        <section aria-labelledby="wrongful-conviction-heading" className="bg-[#f2ece0]">
          <div className="mx-auto w-full max-w-4xl px-6 py-14">
            <p className="text-center text-xs font-semibold tracking-widest text-[#8a7f5f] uppercase">
              Why this work matters
            </p>
            <h2
              id="wrongful-conviction-heading"
              className="mx-auto mt-2 max-w-xl text-center font-serif text-3xl text-[#14120e]"
            >
              Wrongful conviction isn&apos;t rare. It&apos;s systemic.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-[#5a5138]">
              Every case below is a person convicted — many still incarcerated
              today — on evidence that doesn&apos;t hold up to serious
              scrutiny. That&apos;s exactly why Xonorate exists: to put a name
              and a face on the numbers, and keep pushing until each case gets
              the review it deserves.
            </p>

            <dl className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
              {WRONGFUL_CONVICTION_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-7 w-7 text-[#c99a44]" aria-hidden />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="mt-3 font-serif text-5xl font-extrabold tracking-tight text-[#14120e] tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="mx-auto mt-3 max-w-[22ch] text-base font-semibold text-[#3a2f18]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-[#d3c7a5] pt-10">
              <h3 className="text-center font-serif text-lg text-[#14120e]">
                Leading causes of wrongful conviction
              </h3>
              <p className="mx-auto mt-1 max-w-md text-center text-xs text-[#8a7f5f]">
                Share of Innocence Project client cases involving each factor.
                Most wrongful convictions involve more than one.
              </p>

              <div className="mx-auto mt-8 max-w-md">
                {WRONGFUL_CONVICTION_CAUSES.map((cause) => (
                  <div key={cause.label} className="mt-5 first:mt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-[#3a2f18]">{cause.label}</span>
                      <span className="font-sans text-sm font-semibold text-[#14120e]">
                        {cause.value}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-r-[4px] bg-[#e7dfcd]">
                      <div
                        className="h-2 rounded-r-[4px] bg-[#c99a44]"
                        style={{ width: `${cause.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-[#d3c7a5] pt-10 sm:flex-row sm:justify-between sm:gap-6">
              <p className="font-mono text-xs tracking-wide text-[#8a7f5f] uppercase">
                Sources —{" "}
                <a
                  href="https://exonerationregistry.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#2b6273] normal-case underline decoration-current underline-offset-2 hover:text-[#1f4a58]"
                >
                  National Registry of Exonerations
                </a>
                {" · "}
                <a
                  href="https://innocenceproject.org/exonerations-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#2b6273] normal-case underline decoration-current underline-offset-2 hover:text-[#1f4a58]"
                >
                  Innocence Project
                </a>
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-4">
                <Link
                  href="/impact"
                  className="text-sm font-medium text-[#8a5f1a] underline hover:text-[#14120e]"
                >
                  See the human cost
                </Link>
                <Link
                  href="/cases"
                  className="rounded-md bg-[#c99a44] px-5 py-2 text-sm font-medium text-[#14120e] transition hover:bg-[#e3b866]"
                >
                  See who we&apos;re fighting for
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                  Featured cases
                </p>
                <h2 className="mt-2 font-serif text-3xl text-header-foreground">
                  Real people. Real stories. Real injustice.
                </h2>
              </div>
              <Link
                href="/cases"
                className="hidden shrink-0 items-center gap-1 text-sm text-header-muted underline transition hover:text-header-foreground sm:flex"
              >
                View all cases <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCases.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.slug}`}
                  className="group overflow-hidden rounded-lg border border-header-border bg-muted-background transition hover:border-brand/50"
                >
                  <div className="relative h-40 w-full">
                    {c.photoUrl ? (
                      <Image
                        src={c.photoUrl}
                        alt={c.clientName}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <RedactedPhoto seed={i} />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block border border-brand/50 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brand uppercase">
                      {CASE_STATUS_LABEL[c.status] ?? c.status}
                    </span>
                    <p className="mt-2 font-serif text-lg text-header-foreground">
                      {c.clientName}
                    </p>
                    <p className="mt-1 font-mono text-xs text-header-muted uppercase">
                      {c.state}
                    </p>
                    <p className="mt-2 text-xs text-header-muted">
                      Convicted: {c.convictedYear}
                      {c.timeServed ? ` · Served: ${c.timeServed}` : ""}
                    </p>
                    <span className="mt-3 inline-block text-xs font-bold text-brand">
                      View case →
                    </span>
                  </div>
                </Link>
              ))}
              <div className="flex flex-col justify-center gap-3 bg-header-border/30 p-6">
                <h3 className="font-serif text-lg text-header-foreground">
                  Know someone wrongfully convicted?
                </h3>
                <p className="text-sm text-header-muted">
                  Submitting a case is the first step toward review.
                </p>
                <Link
                  href="/submit-case"
                  className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
                >
                  Submit a case →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-header-border bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="font-mono text-xs tracking-widest text-brand uppercase">Take action</p>
            <h2 className="mt-2 font-serif text-3xl text-header-foreground">
              Be part of the solution.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-header-border bg-header-border sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/petitions" className="flex flex-col gap-3 bg-header-background p-6 transition hover:bg-muted-background">
                <span className="font-mono text-xs text-brand">01</span>
                <h3 className="font-medium text-header-foreground">Sign petitions</h3>
                <p className="text-sm text-header-muted">
                  Add your name to a case actively pushing for review.
                </p>
              </Link>
              <Link href="/cases" className="flex flex-col gap-3 bg-header-background p-6 transition hover:bg-muted-background">
                <span className="font-mono text-xs text-brand">02</span>
                <h3 className="font-medium text-header-foreground">Share a case</h3>
                <p className="text-sm text-header-muted">
                  Reach is the resource we have the most of — use it.
                </p>
              </Link>
              <Link href="/submit-case" className="flex flex-col gap-3 bg-header-background p-6 transition hover:bg-muted-background">
                <span className="font-mono text-xs text-brand">03</span>
                <h3 className="font-medium text-header-foreground">Submit a case</h3>
                <p className="text-sm text-header-muted">
                  Tell us about someone who may have been wrongly convicted.
                </p>
              </Link>
              <Link href="/submit-inquiry" className="flex flex-col gap-3 bg-header-background p-6 transition hover:bg-muted-background">
                <span className="font-mono text-xs text-brand">04</span>
                <h3 className="font-medium text-header-foreground">Submit an inquiry</h3>
                <p className="text-sm text-header-muted">
                  Have a question, a lead, or a document? Send it our way.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                  The wins
                </p>
                <h2 className="mt-2 font-serif text-3xl text-header-foreground">
                  Exonerated
                </h2>
              </div>
              <Link
                href="/exonerated"
                className="hidden shrink-0 items-center gap-1 text-sm text-header-muted underline transition hover:text-header-foreground sm:flex"
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
                  const yearsLost =
                    exoneration?.year && conviction.year
                      ? exoneration.year - conviction.year
                      : null;
                  return (
                    <Link
                      key={row.id}
                      href={`/cases/${row.slug}`}
                      className="group overflow-hidden rounded-lg border border-header-border bg-muted-background transition hover:border-brand/50"
                    >
                      <div className="relative h-40 w-full">
                        {row.photoUrl ? (
                          <Image
                            src={row.photoUrl}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <RedactedPhoto seed={i + 1} />
                        )}
                      </div>
                      <div className="p-4">
                        <span className="inline-block border border-brand bg-brand/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brand uppercase">
                          Exonerated
                        </span>
                        {!row.isClient && (
                          <span className="ml-2 font-mono text-[10px] tracking-wide text-header-muted uppercase">
                            {SPOTLIGHT_CASE_LABEL}
                          </span>
                        )}
                        <p className="mt-2 line-clamp-2 font-serif text-lg text-header-foreground">
                          {row.clientName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-header-muted uppercase">
                          {row.state}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-header-muted">
                          {teaser}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          {yearsLost != null && yearsLost > 0 ? (
                            <span className="font-semibold text-brand">
                              {yearsLost} year{yearsLost === 1 ? "" : "s"} lost
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="font-bold text-brand">Read the case →</span>
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
          <section className="mx-auto w-full max-w-3xl px-6 py-16">
            <p className="font-mono text-xs tracking-widest text-brand uppercase">
              Our own record
            </p>
            <h2 className="mt-2 font-serif text-2xl text-foreground">
              Our impact so far
            </h2>
            <p className="mt-1 text-sm text-muted">
              Counted live from our own case files — not a national estimate.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="border border-border bg-muted-background p-5 text-center"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd
                    className={`font-mono font-bold text-brand tabular-nums ${
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
      </main>
      <SiteFooter />
    </div>
  );
}
