"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createCaseIssue } from "@/family/case-issues";
import { familyCaseIssuePriorityEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  description: z.string().trim().optional(),
  priority: z.enum(familyCaseIssuePriorityEnum.enumValues),
  assignedPersonId: z.string().optional(),
  relatedDocumentId: z.string().optional(),
  relatedTimelineEventId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createCaseIssueAction(
  familyId: string,
  lovedOneId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, description, priority, assignedPersonId, relatedDocumentId, relatedTimelineEventId, dueDate } =
    parsed.data;

  await createCaseIssue(familyId, lovedOneId, membership.session.user.id, {
    title,
    description: description || null,
    priority,
    assignedPersonId: assignedPersonId || null,
    relatedDocumentId: relatedDocumentId || null,
    relatedTimelineEventId: relatedTimelineEventId || null,
    dueDate: dueDate || null,
  });

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case/notes-issues`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: true };
}
