import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, signatures } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const signedPetitions = await db
    .select({
      petitionId: petitions.id,
      petitionSlug: petitions.slug,
      petitionTitle: petitions.title,
      caseId: cases.id,
      caseSlug: cases.slug,
      caseClientName: cases.clientName,
    })
    .from(signatures)
    .innerJoin(petitions, eq(signatures.petitionId, petitions.id))
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .where(eq(signatures.userId, session.user.id))
    .orderBy(desc(signatures.createdAt));

  // "Cases you follow" is derived from petitions you've signed that are
  // tied to a case — there's no separate follow feature in the schema.
  const followedCases = new Map<string, { slug: string; clientName: string }>();
  for (const row of signedPetitions) {
    if (row.caseId && row.caseSlug && row.caseClientName) {
      followedCases.set(row.caseId, { slug: row.caseSlug, clientName: row.caseClientName });
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">
          Welcome, {session.user.name ?? session.user.email}
        </h1>

        <section className="mt-10">
          <h2 className="font-serif text-lg text-foreground">Petitions you&apos;ve signed</h2>
          {signedPetitions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              You haven&apos;t signed any petitions yet.{" "}
              <Link href="/petitions" className="underline">
                Browse petitions
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {signedPetitions.map((row) => (
                <li key={row.petitionId}>
                  <Link
                    href={`/petitions/${row.petitionSlug}`}
                    className="text-foreground underline"
                  >
                    {row.petitionTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-lg text-foreground">Cases you&apos;re supporting</h2>
          {followedCases.size === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Sign a case-specific petition and it&apos;ll show up here.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...followedCases.entries()].map(([caseId, c]) => (
                <li key={caseId}>
                  <Link href={`/cases/${c.slug}`} className="text-foreground underline">
                    {c.clientName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
