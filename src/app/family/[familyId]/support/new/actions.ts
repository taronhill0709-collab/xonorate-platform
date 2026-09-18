"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createSupportPerson } from "@/family/support-people";

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

export async function createSupportPersonAction(
  familyId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, relationship, email, phone, role, canHelpWith, notes, lovedOneId } = parsed.data;

  await createSupportPerson(familyId, {
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

  revalidatePath(`/family/${familyId}/support`);
  revalidatePath(`/family/${familyId}`);
  return { success: true };
}
