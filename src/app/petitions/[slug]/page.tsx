import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CommentSection } from "@/components/comment-section";
import { PetitionSignForm } from "@/components/petition-sign-form";
import { ShareButtons } from "@/components/share-buttons";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, signatures } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";

// Signature counts must always be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [petition] = await db
    .select({ title: petitions.title, askText: petitions.askText })
    .from(petitions)
    .where(eq(petitions.slug, slug))
    .limit(1);

  if (!petition) return { title: "Petition not found" };

  const origin = await getOrigin();
  const url = `${origin}/petitions/${slug}`;

  return {
    title: petition.title,
    description: petition.askText,
    alternates: { canonical: url },
    openGraph: {
      title: petition.title,
      description: petition.askText,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: petition.title,
      description: petition.askText,
    },
  };
}

export default async function PetitionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { slug } = await params;
  const { confirmed } = await searchParams;

  const [petition] = await db
    .select()
    .from(petitions)
    .where(eq(petitions.slug, slug))
    .limit(1);
  if (!petition) notFound();

  const linkedCase = petition.caseId
    ? (
        await db
          .select({ slug: cases.slug, clientName: cases.clientName })
          .from(cases)
          .where(eq(cases.id, petition.caseId))
          .limit(1)
      )[0]
    : null;

  const [{ value: verifiedOnPlatform }] = await db
    .select({ value: count() })
    .from(signatures)
    .where(and(eq(signatures.petitionId, petition.id), eq(signatures.verified, true)));
  const signatureCount = verifiedOnPlatform + petition.startingSignatureCount;

  const recentSigners = await db
    .select({ displayName: signatures.displayName, comment: signatures.comment })
    .from(signatures)
    .where(and(eq(signatures.petitionId, petition.id), eq(signatures.verified, true)))
    .orderBy(desc(signatures.createdAt))
    .limit(20);

  const signersWithComments = recentSigners.filter((s) => s.comment);
  const pct = Math.min(100, Math.round((signatureCount / petition.goalCount) * 100));
  const origin = await getOrigin();

  const session = await auth();
  let initiallySigned = false;
  if (session?.user) {
    const [ownSignature] = await db
      .select({ verified: signatures.verified })
      .from(signatures)
      .where(
        and(eq(signatures.petitionId, petition.id), eq(signatures.userId, session.user.id)),
      )
      .limit(1);
    initiallySigned = ownSignature?.verified ?? false;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        {linkedCase && (
          <Link
            href={`/cases/${linkedCase.slug}`}
            className="text-xs font-medium uppercase tracking-wide text-brand hover:underline"
          >
            For {linkedCase.clientName}
          </Link>
        )}
        <h1 className="mt-1 font-serif text-3xl text-foreground">{petition.title}</h1>
        <p className="mt-4 whitespace-pre-line text-foreground">{petition.askText}</p>

        <div className="mt-6">
          <div className="h-2 rounded-full bg-muted-background">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {signatureCount.toLocaleString()} of {petition.goalCount.toLocaleString()} signatures
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border p-5">
          <PetitionSignForm
            petitionId={petition.id}
            alreadyConfirmed={confirmed === "1"}
            initiallySigned={initiallySigned}
          />
        </div>

        <div className="mt-6">
          <ShareButtons url={`${origin}/petitions/${slug}`} title={petition.title} />
        </div>

        {signersWithComments.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-lg text-foreground">Why people are signing</h2>
            <ul className="mt-4 space-y-4">
              {signersWithComments.map((s, i) => (
                <li key={i} className="border-l-2 border-border pl-4 text-sm">
                  <p className="text-foreground">&ldquo;{s.comment}&rdquo;</p>
                  <p className="mt-1 text-muted">— {s.displayName}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CommentSection targetType="petition" targetId={petition.id} />
      </main>
    </>
  );
}
