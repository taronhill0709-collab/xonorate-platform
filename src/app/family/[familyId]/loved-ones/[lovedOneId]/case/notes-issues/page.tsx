import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listNotesForFamily } from "@/family/notes";
import { listCaseIssuesForLovedOne } from "@/family/case-issues";
import { CASE_ISSUE_PRIORITY_LABELS, CASE_ISSUE_STATUS_LABELS } from "@/family/case-issues-types";
import { CaseTabs } from "../case-tabs";

function issueStatusClass(status: string): string {
  if (status === "resolved") return "bg-accent/15 text-accent";
  if (status === "open") return "bg-brand-light text-brand";
  return "bg-muted-background text-muted ring-1 ring-border";
}

export default async function CaseNotesIssuesPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const membership = await requireFamilyMember(familyId);
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const [notes, issues] = await Promise.all([
    listNotesForFamily(familyId, membership.session.user.id, { lovedOneId }),
    listCaseIssuesForLovedOne(familyId, lovedOneId),
  ]);

  return (
    <div className="space-y-8">
      <CaseTabs familyId={familyId} lovedOneId={lovedOneId} />
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Case Organizer</p>
        <h1 className="font-serif text-2xl">Notes &amp; Issues</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Notes</h2>
          <Link
            href={`/family/${familyId}/notes/new?lovedOneId=${lovedOneId}`}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
          >
            Add Note
          </Link>
        </div>
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted-background p-8 text-center">
            <p className="text-sm text-muted">
              &ldquo;Talked to attorney on Tuesday.&rdquo; &ldquo;Mom has the original paperwork.&rdquo;
              Keep track of anything worth remembering.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => {
              const isOwn = note.authorUserId === membership.session.user.id;
              return (
                <li key={note.id} className="rounded-2xl border border-border bg-muted-background p-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                    {isOwn && (
                      <Link
                        href={`/family/${familyId}/notes/${note.id}/edit`}
                        className="shrink-0 text-xs font-semibold text-brand"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {isOwn ? "You" : note.authorName || note.authorEmail} ·{" "}
                    {note.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Issues &amp; Questions</h2>
          <Link
            href={`/family/${familyId}/loved-ones/${lovedOneId}/case/issues/new`}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
          >
            Add Issue
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted-background p-8 text-center">
            <p className="text-sm text-muted">
              &ldquo;Why do these two documents show different dates?&rdquo; &ldquo;We don&rsquo;t have
              the complete transcript.&rdquo; Track things worth clarifying or investigating.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {issues.map((issue) => (
              <li key={issue.id} className="rounded-2xl border border-border bg-muted-background p-5">
                <Link
                  href={`/family/${familyId}/loved-ones/${lovedOneId}/case/issues/${issue.id}/edit`}
                  className="flex items-start justify-between gap-4 transition hover:text-brand"
                >
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    {issue.description && <p className="mt-1 text-sm text-muted">{issue.description}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {CASE_ISSUE_PRIORITY_LABELS[issue.priority]} priority
                      {issue.assignedPersonName ? ` · Assigned to ${issue.assignedPersonName}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${issueStatusClass(issue.status)}`}>
                    {CASE_ISSUE_STATUS_LABELS[issue.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
