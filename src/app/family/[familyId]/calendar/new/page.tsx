import { listLovedOnesForFamily } from "@/family/loved-ones";
import { CreateEventForm } from "./create-event-form";

export default async function NewCalendarEventPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const lovedOnes = await listLovedOnesForFamily(familyId);

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add Event</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Visits, court dates, calls, deposits — keep track of everything in
        one place.
      </p>
      <div className="mt-8">
        <CreateEventForm
          familyId={familyId}
          lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
        />
      </div>
    </div>
  );
}
