import { notFound } from "next/navigation";
import { getTimelineEventForFamily } from "@/family/timeline";
import { EditTimelineEventForm } from "./edit-timeline-event-form";

export default async function EditTimelineEventPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string; eventId: string }>;
}) {
  const { familyId, lovedOneId, eventId } = await params;
  const event = await getTimelineEventForFamily(familyId, eventId);
  if (!event) notFound();

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Edit Timeline Event</h1>
      <div className="mt-8">
        <EditTimelineEventForm
          familyId={familyId}
          lovedOneId={lovedOneId}
          eventId={eventId}
          eventType={event.eventType}
          eventDate={event.eventDate}
          description={event.description}
        />
      </div>
    </div>
  );
}
