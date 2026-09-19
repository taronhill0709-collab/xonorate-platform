import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listFamilyDocuments } from "@/family/documents";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_PROCESSING_STATUS_LABELS, type DocumentCategory, type DocumentProcessingStatus } from "@/family/documents-types";
import { CaseTabs } from "../case-tabs";

export default async function CaseDocumentsPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const documents = await listFamilyDocuments(familyId, { lovedOneId });

  return (
    <div className="space-y-6">
      <CaseTabs familyId={familyId} lovedOneId={lovedOneId} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Case Organizer</p>
          <h1 className="font-serif text-2xl">Documents</h1>
        </div>
        <Link
          href={`/family/${familyId}/documents/new?lovedOneId=${lovedOneId}`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Upload Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No case documents yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Upload court records, transcripts, correspondence, or other documents so everything stays
            together.
          </p>
          <Link
            href={`/family/${familyId}/documents/new?lovedOneId=${lovedOneId}`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Upload a Document
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-2xl border border-border bg-muted-background p-5">
              <Link
                href={`/family/${familyId}/documents/${doc.id}/edit`}
                className="flex items-start justify-between gap-4 transition hover:text-brand"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  {doc.description && <p className="mt-1 text-sm text-muted">{doc.description}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]}
                    {doc.documentDate ? ` · ${doc.documentDate}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted-background px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-border">
                  {DOCUMENT_PROCESSING_STATUS_LABELS[doc.processingStatus as DocumentProcessingStatus]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
