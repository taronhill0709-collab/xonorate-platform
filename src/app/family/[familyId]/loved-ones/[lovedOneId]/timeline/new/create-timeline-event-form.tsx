"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTimelineEventAction } from "./actions";

// Suggestions only — eventType is free text (see timeline.ts), not a
// closed vocabulary, since families need to log events beyond this list.
const SUGGESTED_EVENT_TYPES = [
  "Arrest",
  "Trial",
  "Conviction",
  "Sentencing",
  "Appeal",
  "Parole hearing",
  "Release",
  "Milestone",
];

export function CreateTimelineEventForm({
  familyId,
  lovedOneId,
}: {
  familyId: string;
  lovedOneId: string;
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
          {SUGGESTED_EVENT_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="eventDate" className="block text-sm font-medium">
          Date
        </label>
        <input
          id="eventDate"
          type="date"
          name="eventDate"
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
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
