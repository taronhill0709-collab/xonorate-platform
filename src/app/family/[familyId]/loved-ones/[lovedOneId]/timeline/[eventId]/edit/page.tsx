import { notFound } from "next/navigation";
import { getTimelineEventForFamily } from "@/family/timeline";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { EditTimelineEventForm } from "./edit-timeline-event-form";

export default async function EditTimelineEventPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string; eventId: string }>;
}) {
  const { familyId, lovedOneId, eventId } = await params;
  const [event, casePeople] = await Promise.all([
    getTimelineEventForFamily(familyId, eventId),
    listCasePeopleForLovedOne(familyId, lovedOneId),
  ]);
  if (!event) notFound();

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Edit Timeline Event</h1>
      <div className="mt-8">
        <EditTimelineEventForm
          familyId={familyId}
          lovedOneId={lovedOneId}
          eventId={eventId}
          title={event.title}
          eventType={event.eventType}
          eventDate={event.eventDate}
          dateConfidence={event.dateConfidence}
          description={event.description}
          relatedPersonId={event.relatedPersonId}
          notes={event.notes}
          casePeople={casePeople.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
