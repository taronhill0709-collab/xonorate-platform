"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyMember } from "@/family/authz";
import { AIRefusalError } from "@/family/ai";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { getReentryPlanForFamily, updateReentryPlanCategory } from "@/family/reentry-plan";
import {
  generateReentryPlanCategoryDraft,
  generateReentryPlanInsight,
  type SupportPersonSummary,
} from "@/family/ai/reentry-plan";
import type { ReentryPlanCategory, ReentryPlanCategoryStatus } from "@/family/reentry-plan-types";

/** Family-wide support people relevant to this loved one — general (unassigned) entries plus ones assigned to this specific loved one. Only name + canHelpWith cross the AI boundary; see docs/AI.md's context rule. */
async function getSupportPeopleContext(familyId: string, lovedOneId: string): Promise<SupportPersonSummary[]> {
  const people = await listSupportPeopleForFamily(familyId);
  return people
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ name: p.name, canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));
}

export async function saveCategoryAction(
  familyId: string,
  lovedOneId: string,
  category: ReentryPlanCategory,
  input: {
    status: ReentryPlanCategoryStatus;
    plan30Day: string;
    plan60Day: string;
    plan90Day: string;
  },
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const result = await updateReentryPlanCategory(familyId, lovedOneId, category, input);
  revalidatePath(`/family/${familyId}/reentry/${lovedOneId}`);
  return { success: Boolean(result) };
}

export async function generateCategoryDraftAction(
  familyId: string,
  lovedOneId: string,
  category: ReentryPlanCategory,
): Promise<
  | { success: true; plan30Day: string; plan60Day: string; plan90Day: string }
  | { success: false; error: string }
> {
  await requireFamilyMember(familyId);
  const [lovedOne, plan, supportPeople] = await Promise.all([
    getLovedOneForFamily(familyId, lovedOneId),
    getReentryPlanForFamily(familyId, lovedOneId),
    getSupportPeopleContext(familyId, lovedOneId),
  ]);
  if (!lovedOne || !plan) return { success: false, error: "Plan not found." };

  const existing = plan.categories.find((c) => c.category === category);

  try {
    const draft = await generateReentryPlanCategoryDraft({
      category,
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      existing: {
        plan30Day: existing?.plan30Day ?? null,
        plan60Day: existing?.plan60Day ?? null,
        plan90Day: existing?.plan90Day ?? null,
      },
      supportPeople,
    });
    return { success: true, ...draft };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return {
        success: false,
        error: "The AI couldn't generate suggestions for this category — please try again.",
      };
    }
    throw err;
  }
}

export async function generateInsightAction(
  familyId: string,
  lovedOneId: string,
): Promise<
  | { success: true; summary: string; nextBestAction: string }
  | { success: false; error: string }
> {
  await requireFamilyMember(familyId);
  const [lovedOne, plan, supportPeople] = await Promise.all([
    getLovedOneForFamily(familyId, lovedOneId),
    getReentryPlanForFamily(familyId, lovedOneId),
    getSupportPeopleContext(familyId, lovedOneId),
  ]);
  if (!lovedOne || !plan) return { success: false, error: "Plan not found." };

  try {
    const insight = await generateReentryPlanInsight({
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      categories: plan.categories.map((c) => ({ category: c.category, status: c.status })),
      supportPeople,
    });
    return { success: true, ...insight };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't generate an insight right now — please try again." };
    }
    throw err;
  }
}
