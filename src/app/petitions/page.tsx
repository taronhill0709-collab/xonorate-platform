import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPetitionsWithProgress } from "@/lib/petitions";

export const metadata: Metadata = {
  title: "Petitions",
  description: "Sign a petition to push for review, reform, or justice for a specific case.",
};

// Signature counts must always be fresh — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function PetitionsIndexPage() {
  const petitionRows = await getPublishedPetitionsWithProgress();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <Eyebrow text="Take action" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Petitions
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              Sign to push for review, reform, or justice for a specific case.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          {petitionRows.length === 0 ? (
            <p className="text-sm text-muted">No active petitions right now.</p>
          ) : (
            <ul className="space-y-6">
              {petitionRows.map((petition) => (
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
                  {petition.recipientName && (
                    <span className="mt-2 inline-flex items-center border border-brand/50 bg-brand-light px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                      Addressed to {petition.recipientName}
                    </span>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{petition.askText}</p>
                  <div className="mt-4">
                    <div className="h-2 bg-muted-background">
                      <div
                        className="h-2 bg-brand"
                        style={{ width: `${petition.percentComplete}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted tabular-nums">
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
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
