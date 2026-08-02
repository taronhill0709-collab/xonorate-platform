import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { petitions, signatures } from "@/db/schema";
import { formatSignerName } from "@/lib/signer-name";

// Comment list must always be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [petition] = await db
    .select({ title: petitions.title })
    .from(petitions)
    .where(and(eq(petitions.slug, slug), eq(petitions.status, "published")))
    .limit(1);

  if (!petition) return { title: "Petition not found" };
  return { title: `Comments — ${petition.title}` };
}

export default async function PetitionCommentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [petition] = await db
    .select()
    .from(petitions)
    .where(and(eq(petitions.slug, slug), eq(petitions.status, "published")))
    .limit(1);
  if (!petition) notFound();

  const signers = await db
    .select({
      displayName: signatures.displayName,
      comment: signatures.comment,
      pinned: signatures.commentPinned,
      createdAt: signatures.createdAt,
    })
    .from(signatures)
    .where(
      and(
        eq(signatures.petitionId, petition.id),
        eq(signatures.verified, true),
        isNotNull(signatures.comment),
      ),
    )
    .orderBy(desc(signatures.commentPinned), desc(signatures.createdAt));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Link href={`/petitions/${slug}`} className="text-sm text-brand underline">
          ← Back to petition
        </Link>
        <h1 className="mt-3 font-serif text-2xl text-foreground">
          Why people are signing
        </h1>
        <p className="mt-1 text-sm text-muted">{petition.title}</p>

        {signers.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No comments yet.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {signers.map((s, i) => (
              <li
                key={i}
                className={
                  s.pinned
                    ? "border-l-2 border-brand bg-brand-light/40 py-2 pl-4 text-sm"
                    : "border-l-2 border-border pl-4 text-sm"
                }
              >
                {s.pinned && (
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand">
                    Pinned
                  </p>
                )}
                <p className="text-foreground">&ldquo;{s.comment}&rdquo;</p>
                <p className="mt-1 text-muted">
                  — {formatSignerName(s.displayName)} ·{" "}
                  {s.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
