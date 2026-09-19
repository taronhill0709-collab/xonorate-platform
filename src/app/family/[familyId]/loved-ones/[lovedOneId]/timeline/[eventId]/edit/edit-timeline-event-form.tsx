"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTimelineEventAction, updateTimelineEventAction } from "./actions";

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

export function EditTimelineEventForm({
  familyId,
  lovedOneId,
  eventId,
  eventType,
  eventDate,
  description,
}: {
  familyId: string;
  lovedOneId: string;
  eventId: string;
  eventType: string;
  eventDate: string;
  description: string;
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
          defaultValue={eventDate}
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
          defaultValue={description}
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
