import { and, count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CommentSection } from "@/components/comment-section";
import { PetitionSignForm } from "@/components/petition-sign-form";
import { ShareButtons } from "@/components/share-buttons";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { caseDocuments, cases, petitions, signatures } from "@/db/schema";
import { CASE_STATUS_LABEL } from "@/lib/case-status";
import { getOrigin } from "@/lib/request-ip";

// Case status/documents and the embedded petition's live count must always
// be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

type ConvictionDetails = {
  charge: string;
  year: number;
  sentence: string;
  contributingFactors: string;
};

type ExonerationDetails = {
  whatLedToExoneration: string;
  year: number;
} | null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [caseRow] = await db
    .select({
      clientName: cases.clientName,
      summary: cases.summary,
      status: cases.status,
      state: cases.state,
      photoUrl: cases.photoUrl,
    })
    .from(cases)
    .where(eq(cases.slug, slug))
    .limit(1);

  if (!caseRow) return { title: "Case not found" };

  const title = `${caseRow.clientName} — ${CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status}`;
  const origin = await getOrigin();
  const url = `${origin}/cases/${slug}`;

  return {
    title,
    description: caseRow.summary,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: caseRow.summary,
      url,
      type: "article",
      images: caseRow.photoUrl ? [caseRow.photoUrl] : undefined,
    },
    twitter: {
      card: caseRow.photoUrl ? "summary_large_image" : "summary",
      title,
      description: caseRow.summary,
      images: caseRow.photoUrl ? [caseRow.photoUrl] : undefined,
    },
  };
}

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { slug } = await params;
  const { confirmed } = await searchParams;

  const [caseRow] = await db.select().from(cases).where(eq(cases.slug, slug)).limit(1);
  if (!caseRow) notFound();

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, caseRow.id))
    .orderBy(caseDocuments.sortOrder);

  const [petition] = await db
    .select()
    .from(petitions)
    .where(eq(petitions.caseId, caseRow.id))
    .orderBy(desc(petitions.createdAt))
    .limit(1);

  const signatureCount = petition
    ? (
        await db
          .select({ value: count() })
          .from(signatures)
          .where(and(eq(signatures.petitionId, petition.id), eq(signatures.verified, true)))
      )[0]?.value ?? 0
    : 0;

  const conviction = caseRow.convictionDetails as ConvictionDetails;
  const exoneration = caseRow.exonerationDetails as ExonerationDetails;
  const origin = await getOrigin();

  const session = await auth();
  let initiallySigned = false;
  if (session?.user && petition) {
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
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          {CASE_STATUS_LABEL[caseRow.status] ?? caseRow.status} · {caseRow.state}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">{caseRow.clientName}</h1>

        {caseRow.photoUrl && (
          <Image
            src={caseRow.photoUrl}
            alt={caseRow.clientName}
            width={640}
            height={400}
            className="mt-6 w-full rounded-lg object-cover"
            unoptimized
          />
        )}

        <p className="mt-6 whitespace-pre-line text-foreground">{caseRow.summary}</p>

        <section className="mt-10">
          <h2 className="font-serif text-lg text-foreground">I. The conviction</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted">Charge</dt>
              <dd className="text-foreground">{conviction.charge}</dd>
            </div>
            <div>
              <dt className="text-muted">Year convicted</dt>
              <dd className="text-foreground">{conviction.year}</dd>
            </div>
            <div>
              <dt className="text-muted">Sentence</dt>
              <dd className="text-foreground">{conviction.sentence}</dd>
            </div>
            {caseRow.timeServed && (
              <div>
                <dt className="text-muted">Time served</dt>
                <dd className="text-foreground">{caseRow.timeServed}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">What contributed to the conviction</dt>
              <dd className="text-foreground">{conviction.contributingFactors}</dd>
            </div>
          </dl>
        </section>

        {exoneration && (
          <section className="mt-10">
            <h2 className="font-serif text-lg text-foreground">II. Exoneration</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Year exonerated</dt>
                <dd className="text-foreground">{exoneration.year}</dd>
              </div>
              <div>
                <dt className="text-muted">What led to exoneration</dt>
                <dd className="text-foreground">{exoneration.whatLedToExoneration}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-serif text-lg text-foreground">
            {exoneration ? "III." : "II."} Documents
          </h2>
          {documents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No documents listed yet.</p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border">
                    <td className="py-2 text-foreground">
                      {doc.fileUrl ? (
                        <a href={doc.fileUrl} className="underline">
                          {doc.title}
                        </a>
                      ) : (
                        doc.title
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          doc.status === "on_file"
                            ? "rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand"
                            : "rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                        }
                      >
                        {doc.status === "on_file" ? "On file" : "Needed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-lg text-foreground">
            {exoneration ? "IV." : "III."} Take action
          </h2>
          {petition ? (
            <div className="mt-4 rounded-lg border border-border p-5">
              <p className="font-serif text-lg text-foreground">{petition.title}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                {petition.askText}
              </p>
              <div className="mt-4">
                <div className="h-2 rounded-full bg-muted-background">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{
                      width: `${Math.min(100, Math.round((signatureCount / petition.goalCount) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {signatureCount.toLocaleString()} of {petition.goalCount.toLocaleString()}{" "}
                  signatures ·{" "}
                  <Link href={`/petitions/${petition.slug}`} className="underline">
                    view petition
                  </Link>
                </p>
              </div>
              <div className="mt-5">
                <PetitionSignForm
                  petitionId={petition.id}
                  alreadyConfirmed={confirmed === "1"}
                  initiallySigned={initiallySigned}
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No active petition for this case yet.</p>
          )}
        </section>

        <div className="mt-10">
          <ShareButtons url={`${origin}/cases/${slug}`} title={caseRow.clientName} />
        </div>

        <CommentSection targetType="case" targetId={caseRow.id} />
      </main>
    </>
  );
}
