import { notFound } from "next/navigation";
import { getFamilyDocumentForFamily } from "@/family/documents";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { getTimelineEventLabel } from "@/family/timeline-types";
import type { DocumentCategory } from "@/family/documents-types";
import { EditDocumentForm } from "./edit-document-form";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ familyId: string; documentId: string }>;
}) {
  const { familyId, documentId } = await params;
  const [doc, lovedOnes] = await Promise.all([
    getFamilyDocumentForFamily(familyId, documentId),
    listLovedOnesForFamily(familyId),
  ]);
  if (!doc) notFound();

  const [timelineEvents, casePeople] = doc.lovedOneId
    ? await Promise.all([
        listTimelineEventsForLovedOne(familyId, doc.lovedOneId),
        listCasePeopleForLovedOne(familyId, doc.lovedOneId),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit Document</h1>
      <EditDocumentForm
        familyId={familyId}
        documentId={documentId}
        title={doc.title}
        category={doc.category as DocumentCategory}
        lovedOneId={doc.lovedOneId}
        tags={(doc.tags as string[] | null) ?? []}
        description={doc.description}
        documentDate={doc.documentDate}
        documentDateConfidence={doc.documentDateConfidence}
        relatedTimelineEventId={doc.relatedTimelineEventId}
        relatedPersonId={doc.relatedPersonId}
        notes={doc.notes}
        lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
        timelineEvents={timelineEvents.map((e) => ({ id: e.id, label: getTimelineEventLabel(e) }))}
        casePeople={casePeople.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
