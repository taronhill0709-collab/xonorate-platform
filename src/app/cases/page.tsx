import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { CasesBrowser } from "@/components/cases-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";

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
      county: cases.county,
      photoUrl: cases.photoUrl,
      isClient: cases.isClient,
      timeServed: cases.timeServed,
      convictionDetails: cases.convictionDetails,
    })
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              The archive
            </p>
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Cases
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              The clients we represent, the facts of their cases, and where
              each one stands. Search, filter, or browse the full record.
            </p>
            <p className="mt-4 text-sm text-header-muted">
              Looking for active campaigns instead?{" "}
              <Link href="/petitions" className="text-link underline hover:text-link-strong">
                View petitions
              </Link>
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No cases published yet.</p>
          ) : (
            <CasesBrowser rows={rows} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
