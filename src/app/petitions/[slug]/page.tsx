import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CommentSection } from "@/components/comment-section";
import { PetitionSignForm } from "@/components/petition-sign-form";
import { ShareButtons } from "@/components/share-buttons";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, petitionUpdates, signatures } from "@/db/schema";
import { getOrigin, resolveShareImage } from "@/lib/request-ip";
import { formatSignerName } from "@/lib/signer-name";

// Signature counts must always be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

async function countSignedThisWeek(petitionId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [{ value }] = await db
    .select({ value: count() })
    .from(signatures)
    .where(
      and(
        eq(signatures.petitionId, petitionId),
        eq(signatures.verified, true),
        gte(signatures.createdAt, sevenDaysAgo),
      ),
    );
  return value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [petition] = await db
    .select({
      title: petitions.title,
      askText: petitions.askText,
      casePhotoUrl: cases.photoUrl,
    })
    .from(petitions)
    .leftJoin(cases, eq(petitions.caseId, cases.id))
    .where(and(eq(petitions.slug, slug), eq(petitions.status, "published")))
    .limit(1);

  if (!petition) return { title: "Petition not found" };

  const origin = await getOrigin();
  const url = `${origin}/petitions/${slug}`;
  const shareImage = resolveShareImage(
    petition.casePhotoUrl,
    origin,
    `${origin}/opengraph-image`,
  );

  return {
    title: petition.title,
    description: petition.askText,
    alternates: { canonical: url },
    openGraph: {
      title: petition.title,
      description: petition.askText,
      url,
      type: "website",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: petition.title,
      description: petition.askText,
      images: [shareImage],
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
    .where(and(eq(petitions.slug, slug), eq(petitions.status, "published")))
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

  const signedThisWeek = await countSignedThisWeek(petition.id);

  const signersWithComments = await db
    .select({
      displayName: signatures.displayName,
      comment: signatures.comment,
      pinned: signatures.commentPinned,
    })
    .from(signatures)
    .where(
      and(
        eq(signatures.petitionId, petition.id),
        eq(signatures.verified, true),
        isNotNull(signatures.comment),
      ),
    )
    .orderBy(desc(signatures.commentPinned), desc(signatures.createdAt))
    .limit(20);

  const updates = await db
    .select({
      id: petitionUpdates.id,
      title: petitionUpdates.title,
      body: petitionUpdates.body,
      createdAt: petitionUpdates.createdAt,
    })
    .from(petitionUpdates)
    .where(eq(petitionUpdates.petitionId, petition.id))
    .orderBy(desc(petitionUpdates.createdAt));

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
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="min-w-0">
          {linkedCase && (
            <Link
              href={`/cases/${linkedCase.slug}`}
              className="text-xs font-medium uppercase tracking-wide text-brand hover:underline"
            >
              For {linkedCase.clientName}
            </Link>
          )}
          <h1 className="mt-1 font-serif text-3xl text-foreground">{petition.title}</h1>
        </div>

        <p className="mt-4 text-sm text-muted">
          Xonorate Media
          {linkedCase && <> on behalf of the {linkedCase.clientName} family</>}.
        </p>

        {petition.recipientName && (
          <span className="mt-4 inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-sm text-brand">
            Addressed to {petition.recipientName}
          </span>
        )}

        <p className="mt-4 whitespace-pre-line text-foreground">{petition.askText}</p>

        <div className="mt-6">
          <div className="h-2 rounded-full bg-muted-background">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {signatureCount.toLocaleString()} of {petition.goalCount.toLocaleString()} signatures
            {signedThisWeek > 0 && (
              <>
                {" · "}
                <span className="text-brand">
                  {signedThisWeek.toLocaleString()} signed this week
                </span>
              </>
            )}
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

        {updates.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-lg text-foreground">Updates</h2>
            <ul className="mt-4 space-y-6">
              {updates.map((u) => (
                <li key={u.id} className="border-l-2 border-brand pl-4">
                  <p className="text-xs text-muted">
                    {u.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{u.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{u.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {signersWithComments.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Why people are signing</h2>
              <Link href={`/petitions/${slug}/comments`} className="text-sm text-brand underline">
                View all comments
              </Link>
            </div>
            <ul className="mt-4 space-y-4">
              {signersWithComments.map((s, i) => (
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
                  <p className="mt-1 text-muted">— {formatSignerName(s.displayName)}</p>
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
