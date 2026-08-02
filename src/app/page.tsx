import { desc, eq } from "drizzle-orm";
import { ArrowRight, Calendar, FileSignature, Scale, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeaturedCasesCarousel } from "@/components/featured-cases-carousel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/markdown";
import { getPlatformStats } from "@/lib/platform-stats";
import { POST_TYPE_LABEL } from "@/lib/post-type";

type ConvictionDetails = { year: number };

const FEED_LIMIT = 3;

// Sourced from the National Registry of Exonerations (exonerationregistry.org):
// 3,478 exonerations logged through the end of 2023, plus 147 more in 2024
// (avg. 13.5 years lost each) — https://www.law.umich.edu/special/exoneration.
const WRONGFUL_CONVICTION_STATS = [
  {
    icon: Scale,
    value: "3,600+",
    label: "Exonerations recorded in the U.S. since 1989",
  },
  {
    icon: Calendar,
    value: "27,000+",
    label: "Years collectively lost to wrongful imprisonment",
  },
  {
    icon: Users,
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
      convictionDetails: cases.convictionDetails,
      timeServed: cases.timeServed,
    })
    .from(cases)
    .orderBy(desc(cases.createdAt))
    .limit(5);

  const featuredCases = recentCases.map((c) => ({
    id: c.id,
    slug: c.slug,
    clientName: c.clientName,
    state: c.state,
    status: c.status,
    photoUrl: c.photoUrl,
    convictedYear: (c.convictionDetails as ConvictionDetails).year,
    timeServed: c.timeServed,
  }));

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
      <SiteHeader />
      <main className="relative flex-1">
        <section className="relative overflow-hidden bg-header-background">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-16 sm:flex-row sm:gap-12 sm:py-20">
            <Image
              src="/xonorate-mark.svg"
              alt=""
              width={280}
              height={280}
              className="h-40 w-40 shrink-0 opacity-30 sm:h-64 sm:w-64"
            />
            <div className="text-center sm:text-left">
              <h1 className="font-serif text-4xl text-header-foreground">
                Xonorate Media Platform
              </h1>
              <p className="mx-auto mt-3 max-w-md text-header-muted sm:mx-0">
                Advocating for the wrongfully convicted — client cases, live
                petitions, and daily advocacy news.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4 sm:justify-start">
                <Link
                  href="/petitions"
                  className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
                >
                  View petitions
                </Link>
                <Link
                  href="/submit-inquiry"
                  className="text-sm text-header-muted underline transition hover:text-header-foreground"
                >
                  Submit an inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="wrongful-conviction-heading"
          className="bg-band-background"
        >
          <div className="mx-auto w-full max-w-4xl px-6 py-14">
            <p className="text-center text-xs font-semibold tracking-widest text-band-accent uppercase">
              Why this work matters
            </p>
            <h2
              id="wrongful-conviction-heading"
              className="mx-auto mt-2 max-w-xl text-center font-serif text-3xl text-band-foreground"
            >
              Wrongful conviction isn&apos;t rare. It&apos;s systemic.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-band-foreground/75">
              Every case below is a person who already served time for something
              they didn&apos;t do. That&apos;s exactly why Xonorate exists — to
              put a name and a face on the numbers, and keep pushing until the
              record is corrected.
            </p>

            <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {WRONGFUL_CONVICTION_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon
                    className="mx-auto h-7 w-7 text-band-accent"
                    aria-hidden
                  />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="mt-2 font-sans text-4xl font-semibold text-band-foreground">
                    {stat.value}
                  </dd>
                  <p className="mt-1.5 text-sm text-band-foreground/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-white/15 pt-10">
              <h3 className="text-center font-serif text-lg text-band-foreground">
                Leading causes of wrongful conviction
              </h3>
              <p className="mx-auto mt-1 max-w-md text-center text-xs text-band-foreground/60">
                Share of Innocence Project client cases involving each factor.
                Most wrongful convictions involve more than one.
              </p>

              <div className="mx-auto mt-8 max-w-md">
                {WRONGFUL_CONVICTION_CAUSES.map((cause) => (
                  <div key={cause.label} className="mt-5 first:mt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-band-foreground/90">
                        {cause.label}
                      </span>
                      <span className="font-sans text-sm font-semibold text-band-foreground">
                        {cause.value}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-r-[4px] bg-white/15">
                      <div
                        className="h-2 rounded-r-[4px] bg-band-accent"
                        style={{ width: `${cause.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/15 pt-10 sm:flex-row sm:justify-between sm:gap-6">
              <p className="text-xs text-band-foreground/60">
                Sources:{" "}
                <a
                  href="https://exonerationregistry.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-band-accent underline hover:text-band-foreground"
                >
                  National Registry of Exonerations
                </a>
                {" · "}
                <a
                  href="https://innocenceproject.org/exonerations-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-band-accent underline hover:text-band-foreground"
                >
                  Innocence Project
                </a>
              </p>
              <Link
                href="/cases"
                className="shrink-0 rounded-md bg-band-accent px-5 py-2 text-sm font-medium text-header-foreground transition hover:opacity-90"
              >
                See who we&apos;re fighting for
              </Link>
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
            <div className="mt-8">
              <FeaturedCasesCarousel cases={featuredCases} />
            </div>
          </div>
        </section>

        <section className="bg-band-background">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-14 text-center sm:flex-row sm:text-left">
            <FileSignature className="h-12 w-12 shrink-0 text-band-accent" />
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                Take action
              </p>
              <h2 className="mt-2 font-serif text-2xl text-band-foreground">
                Your voice can change a life.
              </h2>
              <p className="mt-2 text-sm text-band-foreground/75">
                Sign petitions, share cases, and help bring justice to those
                who were wrongfully convicted.
              </p>
            </div>
            <Link
              href="/petitions"
              className="shrink-0 rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
            >
              Explore petitions
            </Link>
          </div>
        </section>

        <section className="bg-header-background py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-band-accent uppercase">
                  Latest news
                </p>
                <h2 className="mt-2 font-serif text-3xl text-header-foreground">
                  Coverage and updates
                </h2>
              </div>
              <Link
                href="/posts"
                className="hidden shrink-0 items-center gap-1 text-sm text-header-muted underline transition hover:text-header-foreground sm:flex"
              >
                View all news <ArrowRight size={14} />
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <p className="mt-8 text-sm text-header-muted">
                Check back soon for updates.
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {recentPosts.map((row) => (
                  <Link
                    key={row.id}
                    href={`/posts/${row.slug}`}
                    className="group overflow-hidden rounded-lg border border-header-border bg-white/[0.03] transition hover:border-header-muted"
                  >
                    <div className="relative h-40 w-full bg-header-border/40">
                      {row.imageUrl ? (
                        <Image
                          src={row.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-header-muted">
                          <span className="font-serif text-2xl">X</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 rounded-full bg-header-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-header-foreground uppercase">
                        {POST_TYPE_LABEL[row.type] ?? row.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-serif text-lg text-header-foreground">
                        {row.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-header-muted">
                        {excerptFromMarkdown(row.body)}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-header-muted">
                        {row.publishedAt && (
                          <span>
                            {row.publishedAt.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <span className="text-band-accent underline">
                          Read more →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {platformStats.length > 0 && (
          <section className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 className="font-serif text-xl text-foreground">
              Our impact so far
            </h2>
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
      </main>
      <SiteFooter />
    </div>
  );
}
