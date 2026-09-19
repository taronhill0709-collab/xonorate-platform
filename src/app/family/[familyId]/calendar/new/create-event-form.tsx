"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarEventType } from "@/family/calendar-types";
import type { DateConfidence } from "@/family/loved-ones";
import { createCalendarEventAction } from "./actions";

const CONFIDENCE_OPTIONS: { value: DateConfidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "approximate", label: "Approximate" },
  { value: "unknown", label: "Unknown" },
];

export function CreateEventForm({
  familyId,
  lovedOnes,
  defaultLovedOneId,
}: {
  familyId: string;
  lovedOnes: { id: string; name: string }[];
  defaultLovedOneId?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Computed here (in the browser) rather than sent as separate
    // date/time fields for the server to parse — the browser knows the
    // family's actual local timezone, and the server (which may run in a
    // different one) shouldn't have to guess it.
    const date = formData.get("date") as string;
    const time = (formData.get("time") as string) || "00:00";
    const localDate = new Date(`${date}T${time}`);
    if (Number.isNaN(localDate.getTime())) {
      setStatus({ kind: "error", message: "Please enter a valid date." });
      return;
    }
    formData.set("eventDateIso", localDate.toISOString());

    setStatus({ kind: "loading" });
    const result = await createCalendarEventAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/calendar`);
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
          placeholder="e.g. Visit at Green Haven"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue="visit"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(CALENDAR_EVENT_TYPE_LABELS) as [CalendarEventType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">
            Time <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="time"
            type="time"
            name="time"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="dateConfidence" className="block text-sm font-medium">
          Date confidence
        </label>
        <select
          id="dateConfidence"
          name="dateConfidence"
          defaultValue="confirmed"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
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
            defaultValue={defaultLovedOneId ?? ""}
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

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
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
