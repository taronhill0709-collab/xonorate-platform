"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createTimelineEvent } from "@/family/timeline";
import { dateConfidenceEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().optional(),
  eventType: z.string().trim().min(1, "Please choose or enter a type."),
  dateConfidence: z.enum(dateConfidenceEnum.enumValues),
  eventDate: z.string().optional(),
  description: z.string().trim().min(1, "Please describe what happened."),
  relatedPersonId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createTimelineEventAction(
  familyId: string,
  lovedOneId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const membership = await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, eventType, dateConfidence, eventDate, description, relatedPersonId, notes } = parsed.data;

  const row = await createTimelineEvent(familyId, lovedOneId, membership.session.user.id, {
    title: title || null,
    eventType,
    eventDate: dateConfidence === "unknown" || !eventDate ? null : eventDate,
    dateConfidence,
    description,
    relatedPersonId: relatedPersonId || null,
    notes: notes || null,
  });
  if (!row) return { success: false, error: "Loved one not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: true };
}
