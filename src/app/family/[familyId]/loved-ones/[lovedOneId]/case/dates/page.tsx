import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listCalendarEventsForFamily } from "@/family/calendar";
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarEventType } from "@/family/calendar-types";
import { CaseTabs } from "../case-tabs";

export default async function CaseDatesPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const allEvents = await listCalendarEventsForFamily(familyId);
  const events = allEvents.filter((e) => e.lovedOneId === lovedOneId);

  return (
    <div className="space-y-6">
      <CaseTabs familyId={familyId} lovedOneId={lovedOneId} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Case Organizer</p>
          <h1 className="font-serif text-2xl">Important Dates</h1>
        </div>
        <Link
          href={`/family/${familyId}/calendar/new?lovedOneId=${lovedOneId}`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Date
        </Link>
      </div>

      {events.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No important dates yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Hearings, filing deadlines, parole dates — track what&rsquo;s coming up.
          </p>
          <Link
            href={`/family/${familyId}/calendar/new?lovedOneId=${lovedOneId}`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add a Date
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-border bg-muted-background p-5">
              <Link
                href={`/family/${familyId}/calendar/${event.id}/edit`}
                className="flex items-start justify-between gap-4 transition hover:text-brand"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted">{CALENDAR_EVENT_TYPE_LABELS[event.type as CalendarEventType]}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {event.eventDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  {event.dateConfidence === "approximate" && " (approx.)"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
