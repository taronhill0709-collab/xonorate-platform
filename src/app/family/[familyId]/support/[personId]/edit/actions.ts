"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteSupportPerson, updateSupportPerson } from "@/family/support-people";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter a name."),
  relationship: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  role: z.string().trim().optional(),
  canHelpWith: z.string().optional(),
  notes: z.string().trim().optional(),
  lovedOneId: z.string().optional(),
});

export async function updateSupportPersonAction(
  familyId: string,
  personId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, relationship, email, phone, role, canHelpWith, notes, lovedOneId } = parsed.data;

  const updated = await updateSupportPerson(familyId, personId, {
    name,
    relationship: relationship || null,
    email: email || null,
    phone: phone || null,
    role: role || null,
    canHelpWith: canHelpWith
      ? canHelpWith.split(",").map((t) => t.trim()).filter(Boolean)
      : null,
    notes: notes || null,
    lovedOneId: lovedOneId || null,
  });
  if (!updated) return { success: false, error: "Person not found." };

  revalidatePath(`/family/${familyId}/support`);
  return { success: true };
}

export async function deleteSupportPersonAction(
  familyId: string,
  personId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteSupportPerson(familyId, personId);
  revalidatePath(`/family/${familyId}/support`);
  revalidatePath(`/family/${familyId}`);
  return { success: Boolean(removed) };
}
