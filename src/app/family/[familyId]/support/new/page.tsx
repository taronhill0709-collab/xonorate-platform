import { listLovedOnesForFamily } from "@/family/loved-ones";
import { CreateSupportPersonForm } from "./create-support-person-form";

export default async function NewSupportPersonPage({
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
      <h1 className="font-serif text-3xl">Add a Support Person</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Keep track of who&rsquo;s willing to help — with housing, work,
        transportation, or just being there.
      </p>
      <div className="mt-8">
        <CreateSupportPersonForm
          familyId={familyId}
          lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
          defaultLovedOneId={lovedOneId}
        />
      </div>
    </div>
  );
}
