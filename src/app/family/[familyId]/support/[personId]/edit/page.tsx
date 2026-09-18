import { notFound } from "next/navigation";
import { getSupportPersonForFamily } from "@/family/support-people";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import { EditSupportPersonForm } from "./edit-support-person-form";

export default async function EditSupportPersonPage({
  params,
}: {
  params: Promise<{ familyId: string; personId: string }>;
}) {
  const { familyId, personId } = await params;
  const [person, lovedOnes] = await Promise.all([
    getSupportPersonForFamily(familyId, personId),
    listLovedOnesForFamily(familyId),
  ]);
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit {person.name}</h1>
      <EditSupportPersonForm
        familyId={familyId}
        personId={personId}
        name={person.name}
        relationship={person.relationship}
        email={person.email}
        phone={person.phone}
        role={person.role}
        canHelpWith={(person.canHelpWith as string[] | null) ?? []}
        notes={person.notes}
        lovedOneId={person.lovedOneId}
        lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
      />
    </div>
  );
}
