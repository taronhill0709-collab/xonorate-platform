"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteCalendarEvent, updateCalendarEvent } from "@/family/calendar";
import { familyCalendarEventTypeEnum, dateConfidenceEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  type: z.enum(familyCalendarEventTypeEnum.enumValues),
  // See create/actions.ts's schema comment: computed client-side so the
  // family's own timezone is used, not the server's.
  eventDateIso: z.string().min(1, "Please choose a date."),
  dateConfidence: z.enum(dateConfidenceEnum.enumValues),
  lovedOneId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function updateCalendarEventAction(
  familyId: string,
  eventId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, type, eventDateIso, dateConfidence, lovedOneId, notes } = parsed.data;

  const eventDate = new Date(eventDateIso);
  if (Number.isNaN(eventDate.getTime())) {
    return { success: false, error: "Please enter a valid date." };
  }

  const updated = await updateCalendarEvent(familyId, eventId, {
    title,
    type,
    eventDate,
    dateConfidence,
    lovedOneId: lovedOneId || null,
    notes: notes || null,
  });
  if (!updated) return { success: false, error: "Event not found." };

  revalidatePath(`/family/${familyId}/calendar`);
  revalidatePath(`/family/${familyId}`);
  return { success: true };
}

export async function deleteCalendarEventAction(
  familyId: string,
  eventId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteCalendarEvent(familyId, eventId);
  revalidatePath(`/family/${familyId}/calendar`);
  revalidatePath(`/family/${familyId}`);
  return { success: Boolean(removed) };
}
