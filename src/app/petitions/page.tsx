import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, signatures } from "@/db/schema";

export const metadata: Metadata = {
  title: "Petitions",
  description: "Sign a petition to push for review, reform, or justice for a specific case.",
};

// Signature counts must always be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function PetitionsIndexPage() {
  const rows = await db
    .select({
      id: petitions.id,
      title: petitions.title,
      slug: petitions.slug,
      askText: petitions.askText,
      goalCount: petitions.goalCount,
      startingSignatureCount: petitions.startingSignatureCount,
      caseClientName: cases.clientName,
      casePhotoUrl: cases.photoUrl,
    })
    .from(petitions)
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .where(eq(petitions.status, "published"))
    .orderBy(desc(petitions.createdAt));

  const counts = await Promise.all(
    rows.map((row) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(and(eq(signatures.petitionId, row.id), eq(signatures.verified, true)))
        .then(([r]) => r?.value ?? 0),
    ),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Petitions</h1>
        <p className="mt-2 text-muted">
          Sign to push for review, reform, or justice for a specific case.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No active petitions right now.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {rows.map((row, i) => {
              const signatureCount = (counts[i] ?? 0) + row.startingSignatureCount;
              const pct = Math.min(100, Math.round((signatureCount / row.goalCount) * 100));
              return (
                <li
                  key={row.id}
                  className="flex gap-4 rounded-lg border border-border p-5 shadow-sm transition hover:shadow-md"
                >
                  {row.casePhotoUrl && (
                    <Image
                      src={row.casePhotoUrl}
                      alt={row.caseClientName ?? ""}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {row.caseClientName && (
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        For {row.caseClientName}
                      </p>
                    )}
                    <Link
                      href={`/petitions/${row.slug}`}
                      className="mt-1 block font-serif text-xl text-foreground hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{row.askText}</p>
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-muted-background">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {signatureCount.toLocaleString()} of {row.goalCount.toLocaleString()}{" "}
                        signatures
                      </p>
                    </div>
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
