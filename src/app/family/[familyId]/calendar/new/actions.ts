"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createCalendarEvent } from "@/family/calendar";
import { familyCalendarEventTypeEnum } from "@/db/schema";

const schema = z.object({
  title: z.string().trim().min(1, "Please enter a title."),
  type: z.enum(familyCalendarEventTypeEnum.enumValues),
  // An ISO string computed in the browser (see create-event-form.tsx), not
  // separate date/time fields parsed here — parsing "2026-01-02T14:00" on
  // the server would use the SERVER's local timezone, not the family's, and
  // silently shift the time (e.g. Netlify's server runtime is UTC, so a
  // family in New York entering "2:00 PM" could be stored as 9:00 AM
  // Eastern). The browser knows the user's actual timezone; the server
  // shouldn't guess.
  eventDateIso: z.string().min(1, "Please choose a date."),
  lovedOneId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export async function createCalendarEventAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { title, type, eventDateIso, lovedOneId, notes } = parsed.data;

  const eventDate = new Date(eventDateIso);
  if (Number.isNaN(eventDate.getTime())) {
    return { success: false, error: "Please enter a valid date." };
  }

  await createCalendarEvent(familyId, {
    title,
    type,
    eventDate,
    lovedOneId: lovedOneId || null,
    notes: notes || null,
  });

  revalidatePath(`/family/${familyId}/calendar`);
  revalidatePath(`/family/${familyId}`);
  return { success: true };
}
