import { notFound } from "next/navigation";
import { getCaseIssueForFamily } from "@/family/case-issues";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { listFamilyDocuments } from "@/family/documents";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { getTimelineEventLabel } from "@/family/timeline-types";
import { EditCaseIssueForm } from "./edit-case-issue-form";

export default async function EditCaseIssuePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string; issueId: string }>;
}) {
  const { familyId, lovedOneId, issueId } = await params;
  const issue = await getCaseIssueForFamily(familyId, issueId);
  if (!issue) notFound();

  const [casePeople, documents, timelineEvents] = await Promise.all([
    listCasePeopleForLovedOne(familyId, lovedOneId),
    listFamilyDocuments(familyId, { lovedOneId }),
    listTimelineEventsForLovedOne(familyId, lovedOneId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit Issue</h1>
      <EditCaseIssueForm
        familyId={familyId}
        lovedOneId={lovedOneId}
        issueId={issueId}
        title={issue.title}
        description={issue.description}
        status={issue.status}
        priority={issue.priority}
        dueDate={issue.dueDate}
        resolutionNotes={issue.resolutionNotes}
        assignedPersonId={issue.assignedPersonId}
        relatedDocumentId={issue.relatedDocumentId}
        relatedTimelineEventId={issue.relatedTimelineEventId}
        casePeople={casePeople.map((p) => ({ id: p.id, name: p.name }))}
        documents={documents.map((d) => ({ id: d.id, title: d.title }))}
        timelineEvents={timelineEvents.map((e) => ({ id: e.id, label: getTimelineEventLabel(e) }))}
      />
    </div>
  );
}
