import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listTimelineEventsForLovedOne } from "@/family/timeline";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const events = await listTimelineEventsForLovedOne(familyId, lovedOneId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Journey</p>
          <h1 className="font-serif text-2xl">{lovedOne.preferredName || lovedOne.name}&rsquo;s Timeline</h1>
        </div>
        <Link
          href={`/family/${familyId}/loved-ones/${lovedOneId}/timeline/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Event
        </Link>
      </div>

      {events.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No timeline events yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Start building {lovedOne.preferredName || lovedOne.name}&rsquo;s journey by adding
            important dates and milestones.
          </p>
          <Link
            href={`/family/${familyId}/loved-ones/${lovedOneId}/timeline/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add Event
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-border bg-muted-background p-5">
              <Link
                href={`/family/${familyId}/loved-ones/${lovedOneId}/timeline/${event.id}/edit`}
                className="flex items-start justify-between gap-4 transition hover:text-brand"
              >
                <div>
                  <p className="font-medium capitalize">{event.eventType.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-sm text-muted">{event.description}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
