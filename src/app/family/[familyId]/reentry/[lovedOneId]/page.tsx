import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { ensureReentryPlanForLovedOne } from "@/family/reentry-plan";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { ReentryPlanBoard } from "./reentry-plan-board";

export default async function ReentryPlanPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  await requireFamilyMember(familyId);

  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const plan = await ensureReentryPlanForLovedOne(familyId, lovedOneId);
  if (!plan) notFound();

  const supportPeople = await listSupportPeopleForFamily(familyId);
  const relevantSupportPeople = supportPeople
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ name: p.name, canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Reentry Planner</p>
        <h1 className="font-serif text-2xl">{lovedOne.preferredName || lovedOne.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Build a 30/60/90-day plan across every area of reentry. This is a planning aid, not legal
          advice, and nothing here guarantees an outcome.
        </p>
      </div>
      <ReentryPlanBoard
        familyId={familyId}
        lovedOneId={lovedOneId}
        categories={plan.categories}
        supportPeople={relevantSupportPeople}
      />
    </div>
  );
}
