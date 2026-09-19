import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { CreateCasePersonForm } from "./create-case-person-form";

export default async function NewCasePersonPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add a Person</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Attorneys, witnesses, investigators — keep everyone connected to the case in one place.
      </p>
      <div className="mt-8">
        <CreateCasePersonForm familyId={familyId} lovedOneId={lovedOneId} />
      </div>
    </div>
  );
}
