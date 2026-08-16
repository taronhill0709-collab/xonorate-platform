import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { hasImpactContent, type CaseImpact } from "@/lib/case-impact";
import { WRONGFUL_CONVICTION_STATS } from "@/lib/national-exoneration-stats";
import { getPlatformStats } from "@/lib/platform-stats";

export const metadata: Metadata = {
  title: "The Human Cost",
  description:
    "Wrongful conviction doesn't end with the person convicted — it costs families and communities. The scale, nationally, and case by case at Xonorate.",
};

// Every case's impact data can change via the admin CMS at any time.
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const [caseRows, platformStats] = await Promise.all([
    db
      .select({
        id: cases.id,
        clientName: cases.clientName,
        slug: cases.slug,
        photoUrl: cases.photoUrl,
        impact: cases.impact,
      })
      .from(cases)
      .orderBy(asc(cases.sortOrder), desc(cases.createdAt)),
    getPlatformStats(),
  ]);

  const casesWithImpact = caseRows
    .map((c) => ({ ...c, impact: c.impact as CaseImpact | null }))
    .filter((c) => hasImpactContent(c.impact));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">
            The human cost
          </p>
          <h1 className="mx-auto mt-2 max-w-xl font-serif text-3xl text-foreground">
            Wrongful conviction doesn&apos;t end with the person convicted.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
            It costs children a parent, families their income and stability,
            and communities someone who should have been there. Every
            national number below represents thousands of stories like the
            ones our clients are living right now.
          </p>
        </section>

        <section
          aria-labelledby="national-scale-heading"
          className="bg-band-background"
        >
          <div className="mx-auto w-full max-w-4xl px-6 py-14">
            <h2
              id="national-scale-heading"
              className="text-center font-serif text-xl text-band-foreground"
            >
              The scale, nationally
            </h2>
            <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
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
            <p className="mt-8 text-center text-xs text-band-foreground/60">
              Source:{" "}
              <a
                href="https://exonerationregistry.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-band-accent underline hover:text-band-foreground"
              >
                National Registry of Exonerations
              </a>
            </p>
          </div>
        </section>

        {platformStats.length > 0 && (
          <section className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 className="text-center font-serif text-xl text-foreground">
              Xonorate&apos;s cases, by the numbers
            </h2>
            <p className="mt-1 text-center text-sm text-muted">
              Counted live from our own case files — not a national estimate.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
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

        <section className="bg-muted-background/40">
          <div className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 className="text-center font-serif text-xl text-foreground">
              Each number is a family
            </h2>
            <p className="mt-1 text-center text-sm text-muted">
              The people behind our cases, and what wrongful conviction cost
              the families and communities around them.
            </p>

            {casesWithImpact.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">
                We&apos;re gathering family and community impact details for
                our cases — check back soon.
              </p>
            ) : (
              <ul className="mt-8 space-y-5">
                {casesWithImpact.map((c) => {
                  const impact = c.impact as CaseImpact;
                  const excerpt = impact.familyImpact || impact.communityImpact;
                  return (
                    <li
                      key={c.id}
                      className="rounded-lg border border-border bg-background p-5 shadow-sm"
                    >
                      <div className="flex gap-4">
                        {c.photoUrl && (
                          <Image
                            src={c.photoUrl}
                            alt={c.clientName}
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-border/70"
                            unoptimized
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/cases/${c.slug}#impact`}
                            className="font-serif text-lg text-foreground hover:underline"
                          >
                            {c.clientName}
                          </Link>
                          {excerpt && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted">
                              {excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                      {impact.stats.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-6 border-t border-border pt-4">
                          {impact.stats.map((stat, i) => (
                            <div key={i}>
                              <p className="font-serif text-2xl text-brand">
                                {stat.value}
                              </p>
                              <p className="mt-0.5 max-w-32 text-xs text-muted">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/cases/${c.slug}#impact`}
                        className="mt-4 inline-block text-sm text-brand underline"
                      >
                        Read {c.clientName.split(" ")[0]}&apos;s story
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <h2 className="font-serif text-xl text-foreground">
            Help push these cases forward
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Every signature and every share puts more pressure on the people
            who can actually fix this.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/petitions"
              className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Sign a petition
            </Link>
            <Link
              href="/cases"
              className="rounded-md border border-border px-5 py-2 text-sm text-foreground transition hover:bg-muted-background"
            >
              Meet our clients
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
