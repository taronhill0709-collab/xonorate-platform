"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyMember } from "@/family/authz";
import { AIRefusalError } from "@/family/ai";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listSupportPeopleForFamily } from "@/family/support-people";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { listFamilyDocuments } from "@/family/documents";
import {
  approveClemencyNarrative,
  createClemencyAccomplishment,
  deleteClemencyAccomplishment,
  listClemencyAccomplishments,
  regenerateClemencyAttorneyQuestions,
  regenerateClemencyNarrativeDraft,
  updateClemencyNarrativeContent,
  type AccomplishmentInput,
} from "@/family/clemency-preparation";
import { generateMissingDocumentationInsight } from "@/family/ai/clemency-preparation";

async function getSupportPeopleContext(familyId: string, lovedOneId: string) {
  const people = await listSupportPeopleForFamily(familyId);
  return people
    .filter((p) => !p.lovedOneId || p.lovedOneId === lovedOneId)
    .map((p) => ({ name: p.name, canHelpWith: (p.canHelpWith as string[] | null) ?? [] }));
}

export async function saveNarrativeAction(
  familyId: string,
  lovedOneId: string,
  content: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const result = await updateClemencyNarrativeContent(familyId, lovedOneId, content);
  revalidatePath(`/family/${familyId}/clemency/${lovedOneId}`);
  return { success: Boolean(result) };
}

export async function generateNarrativeAction(
  familyId: string,
  lovedOneId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) return { success: false, error: "Loved one not found." };

  const [chronology, accomplishmentRows, supportPeople] = await Promise.all([
    listTimelineEventsForLovedOne(familyId, lovedOneId),
    listClemencyAccomplishments(familyId, lovedOneId),
    getSupportPeopleContext(familyId, lovedOneId),
  ]);

  try {
    const result = await regenerateClemencyNarrativeDraft({
      familyId,
      lovedOneId,
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      chronology: chronology.map((e) => ({ eventType: e.eventType, eventDate: e.eventDate, description: e.description })),
      accomplishments: accomplishmentRows.map((a) => ({
        title: a.title,
        description: a.description,
        achievedDate: a.achievedDate,
      })),
      supportPeople,
    });
    if (!result) return { success: false, error: "Preparation not found." };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't draft this narrative — please review your information and try again." };
    }
    throw err;
  }

  revalidatePath(`/family/${familyId}/clemency/${lovedOneId}`);
  return { success: true };
}

export async function saveEditsAndApproveAction(
  familyId: string,
  lovedOneId: string,
  content: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  await updateClemencyNarrativeContent(familyId, lovedOneId, content);
  const result = await approveClemencyNarrative(familyId, lovedOneId);
  revalidatePath(`/family/${familyId}/clemency/${lovedOneId}`);
  return { success: Boolean(result) };
}

export async function addAccomplishmentAction(
  familyId: string,
  lovedOneId: string,
  input: AccomplishmentInput,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const row = await createClemencyAccomplishment(familyId, lovedOneId, input);
  revalidatePath(`/family/${familyId}/clemency/${lovedOneId}`);
  return { success: Boolean(row) };
}

export async function deleteAccomplishmentAction(
  familyId: string,
  lovedOneId: string,
  accomplishmentId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const row = await deleteClemencyAccomplishment(familyId, accomplishmentId);
  revalidatePath(`/family/${familyId}/clemency/${lovedOneId}`);
  return { success: Boolean(row) };
}

export async function generateMissingDocumentationAction(
  familyId: string,
  lovedOneId: string,
): Promise<
  | { success: true; summary: string; likelyMissing: string[] }
  | { success: false; error: string }
> {
  await requireFamilyMember(familyId);
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) return { success: false, error: "Loved one not found." };

  const documents = await listFamilyDocuments(familyId, { lovedOneId });
  const clemencyDocumentTitles = documents.filter((d) => d.category === "clemency").map((d) => d.title);

  try {
    const insight = await generateMissingDocumentationInsight({
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      existingDocumentTitles: clemencyDocumentTitles,
    });
    return { success: true, ...insight };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't check documentation right now — please try again." };
    }
    throw err;
  }
}

export async function generateAttorneyQuestionsAction(
  familyId: string,
  lovedOneId: string,
  narrativeContent: string | null,
  likelyMissingDocuments: string[],
): Promise<{ success: true; questions: string } | { success: false; error: string }> {
  await requireFamilyMember(familyId);
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) return { success: false, error: "Loved one not found." };

  try {
    const result = await regenerateClemencyAttorneyQuestions({
      familyId,
      lovedOneId,
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      narrativeContent,
      likelyMissingDocuments,
    });
    if (!result) return { success: false, error: "Preparation not found." };
    return { success: true, questions: result.attorneyQuestionsContent ?? "" };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't generate questions right now — please try again." };
    }
    throw err;
  }
}
