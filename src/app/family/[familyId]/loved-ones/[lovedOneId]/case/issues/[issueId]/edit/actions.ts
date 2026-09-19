"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteCaseIssue, updateCaseIssue } from "@/family/case-issues";
import { familyCaseIssuePriorityEnum, familyCaseIssueStatusEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  description: z.string().trim().optional(),
  status: z.enum(familyCaseIssueStatusEnum.enumValues),
  priority: z.enum(familyCaseIssuePriorityEnum.enumValues),
  assignedPersonId: z.string().optional(),
  relatedDocumentId: z.string().optional(),
  relatedTimelineEventId: z.string().optional(),
  dueDate: z.string().optional(),
  resolutionNotes: z.string().trim().optional(),
});

export async function updateCaseIssueAction(
  familyId: string,
  lovedOneId: string,
  issueId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const {
    title,
    description,
    status,
    priority,
    assignedPersonId,
    relatedDocumentId,
    relatedTimelineEventId,
    dueDate,
    resolutionNotes,
  } = parsed.data;

  const updated = await updateCaseIssue(familyId, issueId, {
    title,
    description: description || null,
    status,
    priority,
    assignedPersonId: assignedPersonId || null,
    relatedDocumentId: relatedDocumentId || null,
    relatedTimelineEventId: relatedTimelineEventId || null,
    dueDate: dueDate || null,
    resolutionNotes: resolutionNotes || null,
  });
  if (!updated) return { success: false, error: "Issue not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: true };
}

export async function deleteCaseIssueAction(
  familyId: string,
  lovedOneId: string,
  issueId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteCaseIssue(familyId, issueId);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: Boolean(removed) };
}
