import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { EditLovedOneForm } from "./edit-loved-one-form";

export default async function EditLovedOnePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const membership = await requireFamilyMember(familyId);
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit {lovedOne.name}&rsquo;s profile</h1>
      <EditLovedOneForm
        familyId={familyId}
        lovedOneId={lovedOneId}
        lovedOne={lovedOne}
        canDelete={membership.role === "owner"}
      />
    </div>
  );
}
