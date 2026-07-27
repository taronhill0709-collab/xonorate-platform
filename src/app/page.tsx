import { and, count, desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, posts, signatures } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { excerptFromMarkdown } from "@/lib/markdown";
import { POST_TYPE_LABEL } from "@/lib/post-type";

const FEED_LIMIT = 3;

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
    })
    .from(cases)
    .orderBy(desc(cases.createdAt))
    .limit(FEED_LIMIT);

  const recentPetitions = await db
    .select({
      id: petitions.id,
      title: petitions.title,
      slug: petitions.slug,
      goalCount: petitions.goalCount,
      caseClientName: cases.clientName,
    })
    .from(petitions)
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .orderBy(desc(petitions.createdAt))
    .limit(FEED_LIMIT);

  const signatureCounts = await Promise.all(
    recentPetitions.map((p) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(and(eq(signatures.petitionId, p.id), eq(signatures.verified, true)))
        .then(([r]) => r?.value ?? 0),
    ),
  );

  const recentPosts = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(FEED_LIMIT);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <section className="text-center">
          <h1 className="font-serif text-4xl text-foreground">Xonorate Media Platform</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Advocating for the wrongfully convicted — client cases, live petitions, and daily
            advocacy news.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/petitions"
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
            >
              View petitions
            </Link>
            <Link
              href="/submit-inquiry"
              className="text-sm text-muted underline transition hover:text-foreground"
            >
              Submit an inquiry
            </Link>
          </div>
        </section>

        {recentCases.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">Cases</h2>
              <Link href="/cases" className="text-sm text-brand underline">
                View all cases
              </Link>
            </div>
            <ul className="mt-5 space-y-4">
              {recentCases.map((row) => (
                <li key={row.id} className="flex gap-4 rounded-lg border border-border p-5">
                  {row.photoUrl && (
                    <Image
                      src={row.photoUrl}
                      alt={row.clientName}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand">
                      {CASE_STATUS_LABEL[row.status] ?? row.status} · {row.state}
                    </p>
                    <Link
                      href={`/cases/${row.slug}`}
                      className="mt-1 block font-serif text-lg text-foreground hover:underline"
                    >
                      {row.clientName}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentPetitions.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">Active petitions</h2>
              <Link href="/petitions" className="text-sm text-brand underline">
                View all petitions
              </Link>
            </div>
            <ul className="mt-5 space-y-4">
              {recentPetitions.map((row, i) => {
                const signatureCount = signatureCounts[i] ?? 0;
                const pct = Math.min(100, Math.round((signatureCount / row.goalCount) * 100));
                return (
                  <li key={row.id} className="rounded-lg border border-border p-5">
                    {row.caseClientName && (
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        For {row.caseClientName}
                      </p>
                    )}
                    <Link
                      href={`/petitions/${row.slug}`}
                      className="mt-1 block font-serif text-lg text-foreground hover:underline"
                    >
                      {row.title}
                    </Link>
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-muted-background">
                        <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {signatureCount.toLocaleString()} of {row.goalCount.toLocaleString()}{" "}
                        signatures
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recentPosts.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">Latest updates</h2>
              <Link href="/posts" className="text-sm text-brand underline">
                View all updates
              </Link>
            </div>
            <ul className="mt-5 space-y-4">
              {recentPosts.map((row) => (
                <li key={row.id} className="rounded-lg border border-border p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    {POST_TYPE_LABEL[row.type] ?? row.type}
                    {row.publishedAt && (
                      <>
                        {" · "}
                        {row.publishedAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                  <Link
                    href={`/posts/${row.slug}`}
                    className="mt-1 block font-serif text-lg text-foreground hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {excerptFromMarkdown(row.body)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
