"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarEventType } from "@/family/calendar-types";
import { deleteCalendarEventAction, updateCalendarEventAction } from "./actions";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function EditEventForm({
  familyId,
  eventId,
  eventDateIso,
  title,
  type,
  lovedOneId,
  notes,
  lovedOnes,
}: {
  familyId: string;
  eventId: string;
  eventDateIso: string;
  title: string;
  type: CalendarEventType;
  lovedOneId: string | null;
  notes: string | null;
  lovedOnes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  // Lazy useState initializers run once per environment — on the server
  // during SSR (in the server's timezone) and again, independently, on the
  // client during hydration (in the browser's actual timezone) — so this
  // naturally picks up the family's own local time on the client without
  // needing an effect. Controlled form-element `value` mismatches between
  // SSR and hydration don't trigger React's hydration-mismatch warnings the
  // way text content would, so this is safe.
  const [dateValue, setDateValue] = useState(() => {
    const d = new Date(eventDateIso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [timeValue, setTimeValue] = useState(() => {
    const d = new Date(eventDateIso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const date = formData.get("date") as string;
    const time = (formData.get("time") as string) || "00:00";
    const localDate = new Date(`${date}T${time}`);
    if (Number.isNaN(localDate.getTime())) {
      setStatus({ kind: "error", message: "Please enter a valid date." });
      return;
    }
    formData.set("eventDateIso", localDate.toISOString());

    setStatus({ kind: "loading" });
    const result = await updateCalendarEventAction(familyId, eventId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/calendar`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${title}" from the calendar?`)) return;
    await deleteCalendarEventAction(familyId, eventId);
    router.push(`/family/${familyId}/calendar`);
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
        <label htmlFor="type" className="block text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={type}
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
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">
            Time
          </label>
          <input
            id="time"
            type="time"
            name="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
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

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
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
          Remove Event
        </button>
      </div>
    </form>
  );
}
