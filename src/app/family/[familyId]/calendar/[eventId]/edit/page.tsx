import { notFound } from "next/navigation";
import { getCalendarEventForFamily, type CalendarEventType } from "@/family/calendar";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import { EditEventForm } from "./edit-event-form";

export default async function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ familyId: string; eventId: string }>;
}) {
  const { familyId, eventId } = await params;
  const [event, lovedOnes] = await Promise.all([
    getCalendarEventForFamily(familyId, eventId),
    listLovedOnesForFamily(familyId),
  ]);
  if (!event) notFound();

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Edit Event</h1>
      <div className="mt-8">
        <EditEventForm
          familyId={familyId}
          eventId={eventId}
          eventDateIso={event.eventDate.toISOString()}
          title={event.title}
          type={event.type as CalendarEventType}
          lovedOneId={event.lovedOneId}
          notes={event.notes}
          lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
        />
      </div>
    </div>
  );
}
