import { notFound } from "next/navigation";
import { getCasePersonForFamily } from "@/family/case-people";
import type { CasePersonType } from "@/family/case-people-types";
import { EditCasePersonForm } from "./edit-case-person-form";

export default async function EditCasePersonPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string; personId: string }>;
}) {
  const { familyId, lovedOneId, personId } = await params;
  const person = await getCasePersonForFamily(familyId, personId);
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit Person</h1>
      <EditCasePersonForm
        familyId={familyId}
        lovedOneId={lovedOneId}
        personId={personId}
        name={person.name}
        personType={person.personType as CasePersonType}
        organization={person.organization}
        email={person.email}
        phone={person.phone}
        relationshipToCase={person.relationshipToCase}
        notes={person.notes}
      />
    </div>
  );
}
