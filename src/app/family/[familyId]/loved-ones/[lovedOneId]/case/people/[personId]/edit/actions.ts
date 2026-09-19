"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { deleteCasePerson, updateCasePerson } from "@/family/case-people";
import { familyCasePersonTypeEnum } from "@/db/schema";

const schema = z.object({
  personType: z.enum(familyCasePersonTypeEnum.enumValues),
  name: z.string().trim().min(1, "Please enter a name."),
  organization: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  relationshipToCase: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function updateCasePersonAction(
  familyId: string,
  lovedOneId: string,
  personId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { personType, name, organization, email, phone, relationshipToCase, notes } = parsed.data;

  const updated = await updateCasePerson(familyId, personId, {
    personType,
    name,
    organization: organization || null,
    email: email || null,
    phone: phone || null,
    relationshipToCase: relationshipToCase || null,
    notes: notes || null,
  });
  if (!updated) return { success: false, error: "Person not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case/people`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: true };
}

export async function deleteCasePersonAction(
  familyId: string,
  lovedOneId: string,
  personId: string,
): Promise<{ success: boolean }> {
  await requireFamilyMember(familyId);
  const removed = await deleteCasePerson(familyId, personId);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case/people`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  return { success: Boolean(removed) };
}
