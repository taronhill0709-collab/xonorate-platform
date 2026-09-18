import Link from "next/link";
import { listCalendarEventsForFamily } from "@/family/calendar";
import { CALENDAR_EVENT_TYPE_LABELS, type CalendarEventType } from "@/family/calendar";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const events = await listCalendarEventsForFamily(familyId);

  const now = new Date();
  const upcoming = events.filter((e) => e.eventDate >= now);
  const past = events.filter((e) => e.eventDate < now).reverse();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Calendar</h1>
        <Link
          href={`/family/${familyId}/calendar/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Event
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <h3 className="font-serif text-base">No upcoming events yet</h3>
            <p className="mt-2 text-sm text-muted">
              Add a visit, court date, call, or deposit to keep track of what&rsquo;s ahead.
            </p>
            <Link
              href={`/family/${familyId}/calendar/new`}
              className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Add Event
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/family/${familyId}/calendar/${event.id}/edit`}
                  className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm transition hover:ring-1 hover:ring-brand"
                >
                  <div>
                    <span className="font-medium">{event.title}</span>
                    <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
                      {CALENDAR_EVENT_TYPE_LABELS[event.type as CalendarEventType]}
                    </span>
                    {event.lovedOneName && (
                      <span className="ml-2 text-muted">— {event.lovedOneName}</span>
                    )}
                  </div>
                  <span className="text-muted">
                    {event.eventDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h2 className="font-serif text-lg">Past</h2>
          <ul className="mt-4 space-y-2">
            {past.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/family/${familyId}/calendar/${event.id}/edit`}
                  className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm text-muted transition hover:ring-1 hover:ring-brand"
                >
                  <div>
                    <span>{event.title}</span>
                    {event.lovedOneName && <span className="ml-2">— {event.lovedOneName}</span>}
                  </div>
                  <span>
                    {event.eventDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
