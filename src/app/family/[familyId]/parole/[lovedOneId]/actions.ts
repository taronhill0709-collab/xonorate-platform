"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyMember } from "@/family/authz";
import { AIRefusalError } from "@/family/ai";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { getParolePreparationOverview, updateParolePreparationSection } from "@/family/parole-preparation";
import { generateParolePreparationInsight } from "@/family/ai/parole-preparation";
import type { ParoleFreeformSection, ParoleSectionStatus } from "@/family/parole-preparation-types";

export async function saveSectionAction(
  familyId: string,
  lovedOneId: string,
  section: ParoleFreeformSection,
  input: { status: ParoleSectionStatus; notes: string },
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const result = await updateParolePreparationSection(familyId, lovedOneId, section, input);
  revalidatePath(`/family/${familyId}/parole/${lovedOneId}`);
  return { success: Boolean(result) };
}

export async function generateInsightAction(
  familyId: string,
  lovedOneId: string,
): Promise<
  | { success: true; summary: string; nextBestAction: string }
  | { success: false; error: string }
> {
  await requireFamilyMember(familyId);
  const [lovedOne, overview, supportPeople] = await Promise.all([
    getLovedOneForFamily(familyId, lovedOneId),
    getParolePreparationOverview(familyId, lovedOneId),
    listSupportPeopleForFamily(familyId),
  ]);
  if (!lovedOne || !overview) return { success: false, error: "Preparation not found." };

  const relevantSupportPeople = supportPeople
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ name: p.name, canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));

  try {
    const insight = await generateParolePreparationInsight({
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      sections: overview.sections.map((s) => ({ key: s.key, status: s.status })),
      supportPeople: relevantSupportPeople,
    });
    return { success: true, ...insight };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't generate an insight right now — please try again." };
    }
    throw err;
  }
}
