import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import {
  ensureClemencyPreparationForLovedOne,
  getNarrativeContent,
  listClemencyAccomplishments,
} from "@/family/clemency-preparation";
import { ClemencyPreparationBoard } from "./clemency-preparation-board";

export default async function ClemencyPreparationPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  await requireFamilyMember(familyId);

  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const prep = await ensureClemencyPreparationForLovedOne(familyId, lovedOneId);
  if (!prep) notFound();

  const [accomplishments, chronologyCount] = await Promise.all([
    listClemencyAccomplishments(familyId, lovedOneId),
    listTimelineEventsForLovedOne(familyId, lovedOneId).then((rows) => rows.length),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Clemency Preparation</p>
        <h1 className="font-serif text-2xl">{lovedOne.preferredName || lovedOne.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Organize what a clemency application needs. This is drafting assistance, not legal advice
          — Xonorate Family is not an attorney, and nothing here predicts an outcome.
        </p>
      </div>
      <ClemencyPreparationBoard
        familyId={familyId}
        lovedOneId={lovedOneId}
        narrativeContent={getNarrativeContent(prep)}
        narrativeStatus={prep.narrativeStatus}
        attorneyQuestionsContent={prep.attorneyQuestionsContent}
        accomplishments={accomplishments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          achievedDate: a.achievedDate,
        }))}
        chronologyCount={chronologyCount}
      />
    </div>
  );
}
