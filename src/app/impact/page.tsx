import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
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
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <Eyebrow text="The human cost" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Wrongful conviction doesn&apos;t end with the person convicted.
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              It costs children a parent, families their income and
              stability, and communities someone who should have been
              there. Every national number below represents thousands of
              stories like the ones our clients are living right now.
            </p>
          </div>
        </div>

        <section aria-labelledby="national-scale-heading" className="border-b border-header-border bg-band-background">
          <div className="mx-auto w-full max-w-4xl px-6 py-16">
            <p
              id="national-scale-heading"
              className="text-center text-xs font-bold tracking-widest text-band-accent uppercase"
            >
              The scale, nationally
            </p>
            <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {WRONGFUL_CONVICTION_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-7 w-7 text-brand" aria-hidden />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="mt-3 font-serif text-5xl text-band-foreground tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="mx-auto mt-3 max-w-[22ch] text-sm text-header-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-center font-mono text-xs tracking-wide text-header-muted uppercase">
              Source —{" "}
              <a
                href="https://exonerationregistry.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-link normal-case underline hover:text-link-strong"
              >
                National Registry of Exonerations
              </a>
            </p>
          </div>
        </section>

        {platformStats.length > 0 && (
          <section className="border-b border-header-border bg-header-background py-16">
            <div className="mx-auto w-full max-w-3xl px-6">
              <Eyebrow text="Xonorate&apos;s cases, by the numbers" align="center" />
              <p className="mt-2 text-center text-sm text-header-muted">
                Counted live from our own case files — not a national estimate.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {platformStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-header-border bg-muted-background p-5 text-center"
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
                    <p className="mt-1.5 text-xs text-header-muted">{stat.label}</p>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        <section className="border-b border-header-border bg-background py-16">
          <div className="mx-auto w-full max-w-3xl px-6">
            <Eyebrow text="Each number is a family" align="center" />
            <h2 className="mt-2 text-center font-serif text-2xl text-foreground">
              The people behind our cases
            </h2>
            <p className="mt-1 text-center text-sm text-muted">
              What wrongful conviction cost the families and communities
              around them.
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
                    <li key={c.id} className="border border-border p-5">
                      <div className="flex gap-4">
                        {c.photoUrl && (
                          <Image
                            src={c.photoUrl}
                            alt={c.clientName}
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 object-cover"
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
                        className="mt-4 inline-block text-xs font-bold tracking-wide text-brand uppercase hover:underline"
                      >
                        Read {c.clientName.split(" ")[0]}&apos;s story →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-header-background py-16 text-center">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="font-serif text-2xl text-header-foreground">
              Help push these cases forward
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-header-muted">
              Every signature and every share puts more pressure on the
              people who can actually fix this.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/take-action"
                className="bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
              >
                Sign a petition
              </Link>
              <Link
                href="/cases"
                className="border border-header-border px-5 py-2.5 text-xs font-bold tracking-widest text-header-foreground uppercase transition hover:border-brand"
              >
                Meet our clients
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
