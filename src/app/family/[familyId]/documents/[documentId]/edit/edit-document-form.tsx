"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/family/documents-types";
import type { DateConfidence } from "@/family/loved-ones";
import { deleteDocumentAction, updateDocumentAction } from "./actions";

const CONFIDENCE_OPTIONS: { value: DateConfidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "approximate", label: "Approximate" },
  { value: "unknown", label: "Unknown" },
];

export function EditDocumentForm({
  familyId,
  documentId,
  title,
  category,
  lovedOneId,
  tags,
  description,
  documentDate,
  documentDateConfidence,
  relatedTimelineEventId,
  relatedPersonId,
  notes,
  lovedOnes,
  timelineEvents,
  casePeople,
}: {
  familyId: string;
  documentId: string;
  title: string;
  category: DocumentCategory;
  lovedOneId: string | null;
  tags: string[];
  description: string | null;
  documentDate: string | null;
  documentDateConfidence: DateConfidence;
  relatedTimelineEventId: string | null;
  relatedPersonId: string | null;
  notes: string | null;
  lovedOnes: { id: string; name: string }[];
  timelineEvents: { id: string; label: string }[];
  casePeople: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await updateDocumentAction(familyId, documentId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/documents`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${title}" from the vault? This cannot be undone.`)) return;
    await deleteDocumentAction(familyId, documentId);
    router.push(`/family/${familyId}/documents`);
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
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={description ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <label htmlFor="documentDate" className="block text-sm font-medium">
            Document date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="documentDate"
            type="date"
            name="documentDate"
            defaultValue={documentDate ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          name="documentDateConfidence"
          defaultValue={documentDateConfidence}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {lovedOnes.length > 0 && (
        <div>
          <label htmlFor="lovedOneId" className="block text-sm font-medium">
            About <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="lovedOneId"
            name="lovedOneId"
            defaultValue={lovedOneId ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Not specific to one loved one</option>
            {lovedOnes.map((lo) => (
              <option key={lo.id} value={lo.id}>
                {lo.name}
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

      {casePeople.length > 0 && (
        <div>
          <label htmlFor="relatedPersonId" className="block text-sm font-medium">
            Related person <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="relatedPersonId"
            name="relatedPersonId"
            defaultValue={relatedPersonId ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">None</option>
            {casePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="tags" className="block text-sm font-medium">
          Tags <span className="font-normal text-muted">(optional, comma-separated)</span>
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={tags.join(", ")}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={notes ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === "loading" ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-muted transition hover:text-brand"
        >
          Remove Document
        </button>
      </div>
    </form>
  );
}
