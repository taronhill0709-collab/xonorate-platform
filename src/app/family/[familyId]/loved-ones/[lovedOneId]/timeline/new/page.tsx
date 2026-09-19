import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { CreateTimelineEventForm } from "./create-timeline-event-form";

export default async function NewTimelineEventPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add Timeline Event</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Build {lovedOne.preferredName || lovedOne.name}&rsquo;s journey, one milestone at a time.
      </p>
      <div className="mt-8">
        <CreateTimelineEventForm familyId={familyId} lovedOneId={lovedOneId} />
      </div>
    </div>
  );
}
