import { notFound } from "next/navigation";
import { getFamilyDocumentForFamily } from "@/family/documents";
import { listLovedOnesForFamily } from "@/family/loved-ones";
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
        lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
      />
    </div>
  );
}
