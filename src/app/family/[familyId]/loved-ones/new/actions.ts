"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { createLovedOne } from "@/family/loved-ones";
import { resolveFacility } from "@/family/facility";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter a name."),
  preferredName: z.string().trim().optional(),
  inmateId: z.string().trim().optional(),
  facilityName: z.string().trim().optional(),
  facilityState: z.string().trim().optional(),
});

export async function createLovedOneAction(
  familyId: string,
  formData: FormData,
): Promise<
  { success: true; lovedOneId: string } | { success: false; error: string }
> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { name, preferredName, inmateId, facilityName, facilityState } = parsed.data;

  let facilityId: string | null = null;
  if (facilityName && facilityState) {
    facilityId = await resolveFacility(facilityName, facilityState);
  }

  const lovedOne = await createLovedOne(familyId, {
    name,
    preferredName: preferredName || null,
    inmateId: inmateId || null,
    facilityId,
    state: facilityState || null,
  });

  revalidatePath(`/family/${familyId}`);
  return { success: true, lovedOneId: lovedOne.id };
}
