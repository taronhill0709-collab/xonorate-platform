"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteTimelineEvent, updateTimelineEvent } from "@/family/timeline";

const schema = z.object({
  eventType: z.string().trim().min(1, "Please choose or enter a type."),
  eventDate: z.string().min(1, "Please choose a date."),
  description: z.string().trim().min(1, "Please describe what happened."),
});

export async function updateTimelineEventAction(
  familyId: string,
  lovedOneId: string,
  eventId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const updated = await updateTimelineEvent(familyId, eventId, parsed.data);
  if (!updated) return { success: false, error: "Event not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  return { success: true };
}

export async function deleteTimelineEventAction(
  familyId: string,
  lovedOneId: string,
  eventId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteTimelineEvent(familyId, eventId);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  return { success: Boolean(removed) };
}
