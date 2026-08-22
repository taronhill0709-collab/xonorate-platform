import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      photoUrl: cases.photoUrl,
      isClient: cases.isClient,
      convictionDetails: cases.convictionDetails,
      exonerationDetails: cases.exonerationDetails,
      sourceUrl: cases.sourceUrl,
    })
    .from(cases)
    .where(eq(cases.status, "exonerated"))
    .orderBy(asc(cases.sortOrder), desc(cases.updatedAt));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Exonerated</h1>
        <p className="mt-2 text-muted">
          People who were wrongfully convicted and have since been exonerated —
          what contributed to their conviction, and what led to their release.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No exonerations published yet.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {rows.map((row) => {
              const conviction = row.convictionDetails as ConvictionDetails;
              const exoneration = row.exonerationDetails as ExonerationDetails;
              const teaser = exoneration?.whatLedToExoneration || row.summary;
              const yearsLost =
                exoneration?.year && conviction.year ? exoneration.year - conviction.year : null;
              return (
                <li
                  key={row.id}
                  className="flex gap-4 rounded-lg border border-border p-5 shadow-sm transition hover:shadow-md"
                >
                  {row.photoUrl ? (
                    <Image
                      src={row.photoUrl}
                      alt={row.clientName}
                      width={96}
                      height={96}
                      className="h-24 w-24 shrink-0 rounded-full object-cover ring-1 ring-border/70"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted-background ring-1 ring-border/70">
                      <span className="font-serif text-2xl text-muted">
                        {row.clientName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/cases/${row.slug}`}
                        className="font-serif text-xl text-foreground hover:underline"
                      >
                        {row.clientName}
                      </Link>
                      {!row.isClient && (
                        <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground uppercase">
                          {SPOTLIGHT_CASE_LABEL}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      {conviction.charge && (
                        <span className="text-foreground">Convicted of {conviction.charge}</span>
                      )}
                      <span>{row.state}</span>
                      {conviction.year && (
                        <span>
                          {conviction.year}
                          {exoneration?.year ? ` → ${exoneration.year}` : ""}
                        </span>
                      )}
                      {yearsLost != null && yearsLost > 0 && (
                        <span className="font-semibold text-brand">
                          {yearsLost} year{yearsLost === 1 ? "" : "s"} lost
                        </span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted">{teaser}</p>

                    {row.sourceUrl && (
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-muted underline decoration-dotted underline-offset-2 hover:text-brand"
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
      </main>
    </>
  );
}
