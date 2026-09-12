import { asc, desc, ne } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RedactedPhoto } from "@/components/redacted-photo";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { getPublishedPetitionsWithProgress } from "@/lib/petitions";
import { getOrigin } from "@/lib/request-ip";

export const metadata: Metadata = {
  title: "Take Action",
  description:
    "Sign a petition, share a case, submit a case for review, or support Xonorate's investigative and advocacy work.",
};

export const dynamic = "force-dynamic";

const FEATURED_CASE_LIMIT = 3;

export default async function TakeActionPage() {
  const [petitionRows, featuredCases, origin] = await Promise.all([
    getPublishedPetitionsWithProgress(),
    db
      .select({
        id: cases.id,
        clientName: cases.clientName,
        slug: cases.slug,
        state: cases.state,
        photoUrl: cases.photoUrl,
      })
      .from(cases)
      .where(ne(cases.status, "exonerated"))
      .orderBy(asc(cases.sortOrder), desc(cases.createdAt))
      .limit(FEATURED_CASE_LIMIT),
    getOrigin(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              Take action
            </p>
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              You can help change a case.
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              Reach, signatures, and attention are resources too — here&apos;s
              where they matter most right now.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          {/* 01 — SIGN A PETITION */}
          <section>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-brand">01</span>
              <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
                Sign a petition
              </h2>
            </div>
            <p className="mt-2 max-w-xl text-muted">
              Add your voice to a case actively pushing for review.
            </p>

            {petitionRows.length === 0 ? (
              <p className="mt-6 border border-dashed border-border p-6 text-sm text-muted">
                No active petitions right now — check back soon.
              </p>
            ) : (
              <ul className="mt-6 space-y-5">
                {petitionRows.slice(0, 5).map((petition) => (
                  <li key={petition.id} className="border border-border p-5">
                    {petition.caseClientName && (
                      <p className="font-mono text-xs font-bold tracking-wide text-brand uppercase">
                        For {petition.caseClientName}
                      </p>
                    )}
                    <Link
                      href={`/petitions/${petition.slug}`}
                      className="mt-1 block font-serif text-xl text-foreground hover:underline"
                    >
                      {petition.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{petition.askText}</p>
                    <div className="mt-4">
                      <div className="h-2 bg-muted-background">
                        <div
                          className="h-2 bg-brand"
                          style={{ width: `${petition.percentComplete}%` }}
                        />
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-muted tabular-nums">
                        {petition.signatureCount.toLocaleString()} of{" "}
                        {petition.goalCount.toLocaleString()} signatures
                        {petition.signedThisWeek > 0 && (
                          <>
                            {" · "}
                            <span className="text-brand">
                              {petition.signedThisWeek.toLocaleString()} signed this week
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/petitions/${petition.slug}#sign`}
                      className="mt-4 inline-block bg-brand px-5 py-2 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
                    >
                      Sign this petition
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {petitionRows.length > 5 && (
              <Link
                href="/petitions"
                className="mt-4 inline-block text-sm font-semibold tracking-wide text-brand uppercase hover:text-accent"
              >
                View all petitions →
              </Link>
            )}
          </section>

          {/* 02 — SHARE A CASE */}
          <section className="mt-16 border-t border-border pt-14">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-bold text-brand">02</span>
              <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
                Share a case
              </h2>
            </div>
            <p className="mt-2 max-w-xl text-muted">
              Put a story in front of more people. Share directly from here.
            </p>

            {featuredCases.length === 0 ? (
              <p className="mt-6 border border-dashed border-border p-6 text-sm text-muted">
                No active cases to feature right now.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {featuredCases.map((c, i) => (
                  <div key={c.id} className="flex flex-col border border-border">
                    <Link href={`/cases/${c.slug}`} className="relative aspect-4/3 w-full overflow-hidden">
                      {c.photoUrl ? (
                        <Image
                          src={c.photoUrl}
                          alt={c.clientName}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <RedactedPhoto seed={i} />
                      )}
                    </Link>
                    <div className="p-4">
                      <Link href={`/cases/${c.slug}`} className="font-serif text-lg text-foreground hover:underline">
                        {c.clientName}
                      </Link>
                      <p className="font-mono text-xs font-bold text-label uppercase">{c.state}</p>
                      <div className="mt-3">
                        <ShareButtons url={`${origin}/cases/${c.slug}`} title={c.clientName} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 03 & 04 — SUBMIT A CASE / SUPPORT THE FIGHT */}
          <section className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border pt-0 sm:grid-cols-2">
            <div className="flex flex-col gap-3 bg-background p-8">
              <span className="font-mono text-sm font-bold text-brand">03</span>
              <h2 className="font-serif text-2xl text-foreground">Submit a case</h2>
              <p className="text-muted">
                Tell Xonorate about a conviction that doesn&apos;t hold up —
                submitting is the first step toward review.
              </p>
              <Link
                href="/submit-case"
                className="mt-2 inline-flex w-fit items-center gap-1 bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
              >
                Submit a case →
              </Link>
            </div>
            <div className="flex flex-col gap-3 bg-background p-8">
              <span className="font-mono text-sm font-bold text-brand">04</span>
              <h2 className="font-serif text-2xl text-foreground">Support the fight</h2>
              <p className="text-muted">
                Support the investigative and advocacy work itself — every
                case profile, every petition, every story.
              </p>
              <a
                href="https://cash.app/$xonorate"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-fit items-center gap-1 bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
              >
                Support Xonorate →
              </a>
            </div>
          </section>

          <section className="mt-10 border border-dashed border-border p-6 text-sm text-muted">
            Have a question, a lead, or a document instead?{" "}
            <Link href="/submit-inquiry" className="text-brand underline hover:text-accent">
              Submit an inquiry
            </Link>
            .
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
