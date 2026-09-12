import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { RedactedPhoto } from "@/components/redacted-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";

export const metadata: Metadata = {
  title: "Exonerated",
  description:
    "People who were wrongfully convicted and have since been exonerated — what contributed to their conviction, and what led to their release.",
};

// New cases are added via the admin CMS at any time — never statically prerendered.
export const dynamic = "force-dynamic";

type ConvictionDetails = { charge: string; year: number; sentence: string };
type ExonerationDetails = { whatLedToExoneration: string; year: number } | null;

export default async function ExoneratedIndexPage() {
  const rows = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      summary: cases.summary,
      state: cases.state,
      county: cases.county,
      photoUrl: cases.photoUrl,
      isClient: cases.isClient,
      convictionDetails: cases.convictionDetails,
      exonerationDetails: cases.exonerationDetails,
      timeServed: cases.timeServed,
      sourceUrl: cases.sourceUrl,
      contributingFactorTags: cases.contributingFactorTags,
      dnaInvolved: cases.dnaInvolved,
    })
    .from(cases)
    .where(eq(cases.status, "exonerated"))
    .orderBy(asc(cases.sortOrder), desc(cases.updatedAt));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <Eyebrow text="Justice restored" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Exonerated
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              People who were wrongfully convicted and have since been
              exonerated — what contributed to their conviction, and what
              led to their release.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 py-14">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No exonerations published yet.</p>
          ) : (
            <ul className="space-y-6">
              {rows.map((row) => {
                const conviction = row.convictionDetails as ConvictionDetails;
                const exoneration = row.exonerationDetails as ExonerationDetails;
                const teaser = exoneration?.whatLedToExoneration || row.summary;
                // Prefer the attorney-entered time-served figure over the
                // conviction→exoneration year gap — the year math misses
                // pretrial detention, so it understates the real total.
                const yearsLostFallback =
                  exoneration?.year && conviction.year ? exoneration.year - conviction.year : null;
                return (
                  <li
                    key={row.id}
                    className="flex gap-4 border border-border p-5 transition hover:border-brand/50"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden border border-border">
                      {row.photoUrl ? (
                        <Image
                          src={row.photoUrl}
                          alt={row.clientName}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <RedactedPhoto />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/cases/${row.slug}`}
                          className="font-serif text-xl text-foreground hover:underline"
                        >
                          {row.clientName}
                        </Link>
                        {!row.isClient && (
                          <span className="inline-flex items-center border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-brand uppercase">
                            {SPOTLIGHT_CASE_LABEL}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        {conviction.charge && (
                          <span className="text-foreground">Convicted of {conviction.charge}</span>
                        )}
                        <span>
                          {row.state}
                          {row.county ? `, ${row.county} County` : ""}
                        </span>
                        {conviction.year && (
                          <span>
                            {conviction.year}
                            {exoneration?.year ? ` → ${exoneration.year}` : ""}
                          </span>
                        )}
                        {row.timeServed ? (
                          <span className="font-semibold text-brand">{row.timeServed} lost</span>
                        ) : (
                          yearsLostFallback != null &&
                          yearsLostFallback > 0 && (
                            <span className="font-semibold text-brand">
                              {yearsLostFallback} year{yearsLostFallback === 1 ? "" : "s"} lost
                            </span>
                          )
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-muted">{teaser}</p>

                      {((row.contributingFactorTags as string[] | null)?.length || row.dnaInvolved) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {((row.contributingFactorTags as string[] | null) ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                          {row.dnaInvolved && (
                            <span className="inline-flex items-center border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                              DNA evidence
                            </span>
                          )}
                        </div>
                      )}

                      {row.sourceUrl && (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-link underline-offset-2 hover:text-link-strong hover:underline"
                        >
                          Source: National Registry of Exonerations ↗
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
