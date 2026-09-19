"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateConfidence } from "@/family/loved-ones";
import { SUGGESTED_TIMELINE_EVENT_TYPES } from "@/family/timeline-types";
import { deleteTimelineEventAction, updateTimelineEventAction } from "./actions";

const CONFIDENCE_OPTIONS: { value: DateConfidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "approximate", label: "Approximate" },
  { value: "unknown", label: "Unknown" },
];

export function EditTimelineEventForm({
  familyId,
  lovedOneId,
  eventId,
  title,
  eventType,
  eventDate,
  dateConfidence,
  description,
  relatedPersonId,
  notes,
  casePeople,
}: {
  familyId: string;
  lovedOneId: string;
  eventId: string;
  title: string | null;
  eventType: string;
  eventDate: string | null;
  dateConfidence: DateConfidence;
  description: string;
  relatedPersonId: string | null;
  notes: string | null;
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

    const result = await updateTimelineEventAction(familyId, lovedOneId, eventId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this timeline event?")) return;
    await deleteTimelineEventAction(familyId, lovedOneId, eventId);
    router.push(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="eventType" className="block text-sm font-medium">
          Type
        </label>
        <input
          id="eventType"
          name="eventType"
          list="event-type-suggestions"
          required
          defaultValue={eventType}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
        <datalist id="event-type-suggestions">
          {SUGGESTED_TIMELINE_EVENT_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="eventDate"
            type="date"
            name="eventDate"
            defaultValue={eventDate ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          name="dateConfidence"
          defaultValue={dateConfidence}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          What happened
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          defaultValue={description}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

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
        <button type="button" onClick={handleDelete} className="text-sm text-muted transition hover:text-brand">
          Delete Event
        </button>
      </div>
    </form>
  );
}
