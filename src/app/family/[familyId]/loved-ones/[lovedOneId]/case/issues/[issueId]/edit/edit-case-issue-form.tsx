"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CASE_ISSUE_PRIORITY_LABELS,
  CASE_ISSUE_STATUS_LABELS,
  type CaseIssuePriority,
  type CaseIssueStatus,
} from "@/family/case-issues-types";
import { deleteCaseIssueAction, updateCaseIssueAction } from "./actions";

export function EditCaseIssueForm({
  familyId,
  lovedOneId,
  issueId,
  title,
  description,
  status,
  priority,
  dueDate,
  resolutionNotes,
  assignedPersonId,
  relatedDocumentId,
  relatedTimelineEventId,
  casePeople,
  documents,
  timelineEvents,
}: {
  familyId: string;
  lovedOneId: string;
  issueId: string;
  title: string;
  description: string | null;
  status: CaseIssueStatus;
  priority: CaseIssuePriority;
  dueDate: string | null;
  resolutionNotes: string | null;
  assignedPersonId: string | null;
  relatedDocumentId: string | null;
  relatedTimelineEventId: string | null;
  casePeople: { id: string; name: string }[];
  documents: { id: string; title: string }[];
  timelineEvents: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [status_, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await updateCaseIssueAction(familyId, lovedOneId, issueId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteCaseIssueAction(familyId, lovedOneId, issueId);
    router.push(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
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
          defaultValue={title}
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
          defaultValue={description ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            {(Object.entries(CASE_ISSUE_STATUS_LABELS) as [CaseIssueStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={priority}
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
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium">
          Due date <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="dueDate"
          type="date"
          name="dueDate"
          defaultValue={dueDate ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {casePeople.length > 0 && (
        <div>
          <label htmlFor="assignedPersonId" className="block text-sm font-medium">
            Assigned to <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="assignedPersonId"
            name="assignedPersonId"
            defaultValue={assignedPersonId ?? ""}
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
            defaultValue={relatedDocumentId ?? ""}
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
            defaultValue={relatedTimelineEventId ?? ""}
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

      <div>
        <label htmlFor="resolutionNotes" className="block text-sm font-medium">
          Resolution notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="resolutionNotes"
          name="resolutionNotes"
          rows={2}
          defaultValue={resolutionNotes ?? ""}
          placeholder="What was the answer, once you found it?"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {status_.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status_.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={status_.kind === "loading"}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status_.kind === "loading" ? "Saving…" : "Save Changes"}
        </button>
        <button type="button" onClick={handleDelete} className="text-sm text-muted transition hover:text-brand">
          Delete Issue
        </button>
      </div>
    </form>
  );
}
