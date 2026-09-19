import { listLovedOnesForFamily } from "@/family/loved-ones";
import { CreateRequestForm } from "./create-request-form";

export default async function NewLetterRequestPage({
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
      <h1 className="font-serif text-3xl">Ask Someone for a Letter</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Invite a friend, employer, or community member to write their own support letter — in
        their own words, at their own pace.
      </p>
      {lovedOnes.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Add a loved one first before requesting a letter on their behalf.
        </p>
      ) : (
        <div className="mt-8">
          <CreateRequestForm
            familyId={familyId}
            lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
            defaultLovedOneId={lovedOneId}
          />
        </div>
      )}
    </div>
  );
}
