import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { getParolePreparationOverview } from "@/family/parole-preparation";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { ParolePreparationBoard } from "./parole-preparation-board";

export default async function ParolePreparationPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  await requireFamilyMember(familyId);

  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const overview = await getParolePreparationOverview(familyId, lovedOneId);
  if (!overview) notFound();

  const supportPeople = await listSupportPeopleForFamily(familyId);
  const relevantSupportPeople = supportPeople
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ name: p.name, canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Parole Preparation</p>
        <h1 className="font-serif text-2xl">{lovedOne.preferredName || lovedOne.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Track preparation across every part of the hearing process. This is a preparation aid, not
          legal advice, and nothing here predicts or guarantees an outcome.
        </p>
      </div>
      <ParolePreparationBoard
        familyId={familyId}
        lovedOneId={lovedOneId}
        sections={overview.sections}
        freeformNotes={overview.freeformNotes}
        supportPeople={relevantSupportPeople}
      />
    </div>
  );
}
