"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CASE_ISSUE_PRIORITY_LABELS, type CaseIssuePriority } from "@/family/case-issues-types";
import { createCaseIssueAction } from "./actions";

export function CreateCaseIssueForm({
  familyId,
  lovedOneId,
  casePeople,
  documents,
  timelineEvents,
}: {
  familyId: string;
  lovedOneId: string;
  casePeople: { id: string; name: string }[];
  documents: { id: string; title: string }[];
  timelineEvents: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await createCaseIssueAction(familyId, lovedOneId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Need clarification about this filing date"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            {(Object.entries(CASE_ISSUE_PRIORITY_LABELS) as [CaseIssuePriority, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium">
            Due date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="dueDate"
            type="date"
            name="dueDate"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {casePeople.length > 0 && (
        <div>
          <label htmlFor="assignedPersonId" className="block text-sm font-medium">
            Assigned to <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="assignedPersonId"
            name="assignedPersonId"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">No one yet</option>
            {casePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <label htmlFor="relatedDocumentId" className="block text-sm font-medium">
            Related document <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="relatedDocumentId"
            name="relatedDocumentId"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">None</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {timelineEvents.length > 0 && (
        <div>
          <label htmlFor="relatedTimelineEventId" className="block text-sm font-medium">
            Related timeline event <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="relatedTimelineEventId"
            name="relatedTimelineEventId"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">None</option>
            {timelineEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {status.kind === "loading" ? "Saving…" : "Add Issue"}
      </button>
    </form>
  );
}
