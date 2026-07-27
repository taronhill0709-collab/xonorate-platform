import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";

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
    })
    .from(cases)
    .orderBy(desc(cases.createdAt));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Cases</h1>
        <p className="mt-2 text-muted">The clients we represent, and the facts of their cases.</p>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No cases published yet.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {rows.map((row) => (
              <li key={row.id} className="flex gap-4 rounded-lg border border-border p-5">
                {row.photoUrl && (
                  <Image
                    src={row.photoUrl}
                    alt={row.clientName}
                    width={96}
                    height={96}
                    className="h-24 w-24 shrink-0 rounded-md object-cover"
                    unoptimized
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    {CASE_STATUS_LABEL[row.status] ?? row.status} · {row.state}
                  </p>
                  <Link
                    href={`/cases/${row.slug}`}
                    className="mt-1 block font-serif text-xl text-foreground hover:underline"
                  >
                    {row.clientName}
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{row.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
