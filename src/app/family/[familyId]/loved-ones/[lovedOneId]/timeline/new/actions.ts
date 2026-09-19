"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createTimelineEvent } from "@/family/timeline";

const schema = z.object({
  eventType: z.string().trim().min(1, "Please choose or enter a type."),
  eventDate: z.string().min(1, "Please choose a date."),
  description: z.string().trim().min(1, "Please describe what happened."),
});

export async function createTimelineEventAction(
  familyId: string,
  lovedOneId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const row = await createTimelineEvent(familyId, lovedOneId, parsed.data);
  if (!row) return { success: false, error: "Loved one not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/timeline`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  return { success: true };
}
