import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RedactedPhoto } from "@/components/redacted-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";

export const metadata: Metadata = {
  title: "Cases",
  description:
    "Client cases represented by Xonorate Media Platform — active cases, exonerations, and cases awaiting review.",
};

// New cases are added via the admin CMS at any time — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function CasesIndexPage() {
  const rows = await db
    .select({
      id: cases.id,
      clientName: cases.clientName,
      slug: cases.slug,
      summary: cases.summary,
      status: cases.status,
      state: cases.state,
      photoUrl: cases.photoUrl,
      isClient: cases.isClient,
    })
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));

  const activeCases = rows.filter((row) => row.status !== "exonerated");
  const exoneratedCases = rows.filter((row) => row.status === "exonerated");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              Xonorate Media Platform
            </p>
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-4xl">
              Cases
            </h1>
            <p className="mt-2 text-header-muted">
              The clients we represent, and the facts of their cases.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted">
            No cases published yet.
          </p>
        ) : (
          <div className="mx-auto w-full max-w-6xl px-6">
            {activeCases.length > 0 && (
              <section className="py-14">
                <p className="font-mono text-xs tracking-widest text-brand uppercase">
                  Still fighting
                </p>
                <h2 className="mt-2 font-serif text-2xl text-foreground">Active cases</h2>
                <CaseGrid rows={activeCases} seedOffset={0} />
              </section>
            )}
            {exoneratedCases.length > 0 && (
              <section className="border-t border-border py-14">
                <p className="font-mono text-xs tracking-widest text-brand uppercase">
                  The wins
                </p>
                <h2 className="mt-2 font-serif text-2xl text-foreground">Exonerated</h2>
                <CaseGrid rows={exoneratedCases} seedOffset={activeCases.length} />
              </section>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

type CaseRow = {
  id: string;
  clientName: string;
  slug: string;
  summary: string;
  status: string;
  state: string;
  photoUrl: string | null;
  isClient: boolean;
};

function CaseGrid({ rows, seedOffset }: { rows: CaseRow[]; seedOffset: number }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {rows.map((row, i) => (
        <Link
          key={row.id}
          href={`/cases/${row.slug}`}
          className="group overflow-hidden rounded-lg border border-border bg-muted-background transition hover:border-brand/50"
        >
          <div className="relative h-44 w-full">
            {row.photoUrl ? (
              <Image
                src={row.photoUrl}
                alt={row.clientName}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <RedactedPhoto seed={i + seedOffset} />
            )}
          </div>
          <div className="p-5">
            <span
              className={
                row.status === "exonerated"
                  ? "inline-block border border-brand bg-brand/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brand uppercase"
                  : "inline-block border border-brand/50 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brand uppercase"
              }
            >
              {CASE_STATUS_LABEL[row.status] ?? row.status}
            </span>
            {!row.isClient && (
              <span className="ml-2 font-mono text-[10px] tracking-wide text-muted uppercase">
                {SPOTLIGHT_CASE_LABEL}
              </span>
            )}
            <p className="mt-2 font-serif text-xl text-foreground">{row.clientName}</p>
            <p className="mt-1 font-mono text-xs text-muted uppercase">{row.state}</p>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{row.summary}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
