import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { listFamilyDocuments } from "@/family/documents";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { getTimelineEventLabel } from "@/family/timeline-types";
import { CreateCaseIssueForm } from "./create-case-issue-form";

export default async function NewCaseIssuePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const [casePeople, documents, timelineEvents] = await Promise.all([
    listCasePeopleForLovedOne(familyId, lovedOneId),
    listFamilyDocuments(familyId, { lovedOneId }),
    listTimelineEventsForLovedOne(familyId, lovedOneId),
  ]);

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add an Issue</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Track something worth clarifying or investigating — this records your question, not a legal
        conclusion.
      </p>
      <div className="mt-8">
        <CreateCaseIssueForm
          familyId={familyId}
          lovedOneId={lovedOneId}
          casePeople={casePeople.map((p) => ({ id: p.id, name: p.name }))}
          documents={documents.map((d) => ({ id: d.id, title: d.title }))}
          timelineEvents={timelineEvents.map((e) => ({ id: e.id, label: getTimelineEventLabel(e) }))}
        />
      </div>
    </div>
  );
}
