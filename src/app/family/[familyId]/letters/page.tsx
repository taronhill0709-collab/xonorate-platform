import Link from "next/link";
import { requireFamilyMember } from "@/family/authz";
import { getLetterContent, listSupportLettersForFamily } from "@/family/support-letters";
import { listLetterRequestsForFamily } from "@/family/support-letter-requests";
import {
  SUPPORT_LETTER_PURPOSE_LABELS,
  SUPPORT_LETTER_STATUS_LABELS,
  type SupportLetterPurpose,
} from "@/family/support-letters-types";
import { CancelRequestButton } from "./requests/cancel-request-button";

export default async function SupportLettersPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const membership = await requireFamilyMember(familyId);
  const [letters, requests] = await Promise.all([
    listSupportLettersForFamily(familyId),
    listLetterRequestsForFamily(familyId),
  ]);

  const isEmpty = letters.length === 0 && requests.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Support Letters</h1>
          <p className="mt-1 text-sm text-muted">
            Everyone in this family can see these letters as they come together.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/family/${familyId}/letters/requests/new`}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
          >
            Ask Someone for a Letter
          </Link>
          <Link
            href={`/family/${familyId}/letters/new`}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
          >
            Write a Letter
          </Link>
        </div>
      </div>

      {isEmpty ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No letters yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Write one yourself, or ask a friend, employer, or community member to write their own
            — either way, we&rsquo;ll help turn it into a complete, ready-to-send letter.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/family/${familyId}/letters/new`}
              className="inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Write a Letter
            </Link>
            <Link
              href={`/family/${familyId}/letters/requests/new`}
              className="inline-block rounded-xl border border-border bg-background px-4 py-2 text-sm"
            >
              Ask Someone
            </Link>
          </div>
        </section>
      ) : (
        <ul className="space-y-3">
          {letters.map((letter) => {
            const isOwn = letter.authorUserId === membership.session.user.id;
            const content = getLetterContent(letter);
            return (
              <li key={letter.id} className="rounded-2xl border border-border bg-muted-background p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {SUPPORT_LETTER_PURPOSE_LABELS[letter.purpose as SupportLetterPurpose]} — for{" "}
                      {letter.lovedOneName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {letter.recipientName ? `To: ${letter.recipientName} · ` : ""}
                      By {isOwn ? "you" : letter.authorName || letter.authorEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        letter.status === "approved"
                          ? "bg-accent/15 text-accent"
                          : "bg-brand-light text-brand"
                      }`}
                    >
                      {SUPPORT_LETTER_STATUS_LABELS[letter.status]}
                    </span>
                    {isOwn && (
                      <Link
                        href={`/family/${familyId}/letters/${letter.id}`}
                        className="text-xs font-semibold text-brand"
                      >
                        {content ? "Edit" : "Continue"} →
                      </Link>
                    )}
                  </div>
                </div>
                {content && <p className="mt-3 line-clamp-2 text-sm text-muted">{content}</p>}
              </li>
            );
          })}

          {requests.map((request) => {
            const isRequester = request.requestedByUserId === membership.session.user.id;
            const content = getLetterContent(request);
            const statusLabel =
              request.status === "approved"
                ? "Approved"
                : request.status === "answered"
                  ? "Waiting on their approval"
                  : `Waiting on ${request.inviteeName}`;
            return (
              <li key={request.id} className="rounded-2xl border border-border bg-muted-background p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {SUPPORT_LETTER_PURPOSE_LABELS[request.purpose as SupportLetterPurpose]} — for{" "}
                      {request.lovedOneName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {request.recipientName ? `To: ${request.recipientName} · ` : ""}
                      Requested from {request.inviteeName}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        request.status === "approved"
                          ? "bg-accent/15 text-accent"
                          : "bg-brand-light text-brand"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    {isRequester && request.status !== "approved" && (
                      <CancelRequestButton familyId={familyId} requestId={request.id} inviteeName={request.inviteeName} />
                    )}
                  </div>
                </div>
                {content && <p className="mt-3 line-clamp-2 text-sm text-muted">{content}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
