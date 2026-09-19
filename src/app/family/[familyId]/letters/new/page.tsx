import { listLovedOnesForFamily } from "@/family/loved-ones";
import { CreateLetterForm } from "./create-letter-form";

export default async function NewSupportLetterPage({
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
      <h1 className="font-serif text-3xl">Write a Letter</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Answer a few guided questions in your own words — we&rsquo;ll help
        you turn them into a complete, ready-to-send letter.
      </p>
      {lovedOnes.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Add a loved one first before writing a letter on their behalf.
        </p>
      ) : (
        <div className="mt-8">
          <CreateLetterForm
            familyId={familyId}
            lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
            defaultLovedOneId={lovedOneId}
          />
        </div>
      )}
    </div>
  );
}
