"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateConfidence } from "@/family/loved-ones";
import { SUGGESTED_TIMELINE_EVENT_TYPES } from "@/family/timeline-types";
import { createTimelineEventAction } from "./actions";

const CONFIDENCE_OPTIONS: { value: DateConfidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "approximate", label: "Approximate" },
  { value: "unknown", label: "Unknown" },
];

export function CreateTimelineEventForm({
  familyId,
  lovedOneId,
  casePeople,
}: {
  familyId: string;
  lovedOneId: string;
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

    const result = await createTimelineEventAction(familyId, lovedOneId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
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
          placeholder="e.g. Sentencing hearing"
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
          placeholder="e.g. Sentencing"
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
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          name="dateConfidence"
          defaultValue="confirmed"
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
            defaultValue=""
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
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

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
        {status.kind === "loading" ? "Saving…" : "Add Event"}
      </button>
    </form>
  );
}
