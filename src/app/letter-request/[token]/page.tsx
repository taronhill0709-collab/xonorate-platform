import { lookupLetterRequestToken } from "@/family/support-letter-requests";
import { RequestWorkflow } from "./request-workflow";

// Fully public — no /family layout, no login, no family membership. See
// support-letter-requests.ts's header comment and docs/SECURITY.md: the
// token itself is the entire authorization, because the invitee is
// expected to have no Xonorate account.
export default async function LetterRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lookup = await lookupLetterRequestToken(token);

  return (
    <div className="family-scope min-h-screen bg-background text-foreground">
      <header className="border-b border-header-border bg-header-background px-6 py-4 text-header-foreground">
        <div className="mx-auto max-w-2xl font-serif text-xl font-semibold">
          Xonorate <span className="text-brand">Family</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        {!lookup.valid ? (
          <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
            <h1 className="font-serif text-2xl">
              {lookup.reason === "expired" ? "This invitation has expired" : "Invitation not found"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted">
              {lookup.reason === "expired"
                ? "Ask whoever invited you to send a new invitation."
                : "This invitation link is no longer valid."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted-background p-8 text-center">
              <h1 className="font-serif text-2xl">
                Write a support letter for {lookup.lovedOneName}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                {lookup.familyName} invited you to share your own words. No account needed — you
                review and approve everything yourself before it&rsquo;s shared.
              </p>
              {lookup.personalNote && (
                <p className="mx-auto mt-4 max-w-md rounded-xl bg-brand-light px-4 py-3 text-sm text-brand">
                  &ldquo;{lookup.personalNote}&rdquo;
                </p>
              )}
            </div>
            <RequestWorkflow
              key={lookup.finalContent ?? lookup.draftContent ?? "no-content"}
              token={token}
              purpose={lookup.purpose}
              lovedOneName={lookup.lovedOneName}
              answers={lookup.answers}
              content={lookup.finalContent ?? lookup.draftContent}
              alreadyApproved={lookup.status === "approved"}
            />
          </div>
        )}
      </main>
    </div>
  );
}
