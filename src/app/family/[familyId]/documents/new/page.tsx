import { listLovedOnesForFamily } from "@/family/loved-ones";
import { UploadDocumentForm } from "./upload-document-form";

export default async function NewDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ lovedOneId?: string }>;
}) {
  const { familyId } = await params;
  const { lovedOneId } = await searchParams;
  const lovedOnes = await listLovedOnesForFamily(familyId);

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add a Document</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Keep important records organized in one private place.
      </p>
      <div className="mt-8">
        <UploadDocumentForm
          familyId={familyId}
          lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
          defaultLovedOneId={lovedOneId}
        />
      </div>
    </div>
  );
}
