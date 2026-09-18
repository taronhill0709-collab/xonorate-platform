import { listLovedOnesForFamily } from "@/family/loved-ones";
import { CreateNoteForm } from "./create-note-form";

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const lovedOnes = await listLovedOnesForFamily(familyId);

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add a Note</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Keep track of calls, conversations, and small details — anything
        worth remembering.
      </p>
      <div className="mt-8">
        <CreateNoteForm
          familyId={familyId}
          lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
        />
      </div>
    </div>
  );
}
