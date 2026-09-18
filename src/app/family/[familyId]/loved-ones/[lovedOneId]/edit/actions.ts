"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember, requireFamilyOwner } from "@/family/authz";
import { deleteLovedOne, updateLovedOne, type DateConfidence } from "@/family/loved-ones";
import { resolveFacility } from "@/family/facility";

const confidence = z.enum(["confirmed", "approximate", "unknown"]);

const schema = z.object({
  name: z.string().trim().min(1, "Please enter a name."),
  preferredName: z.string().trim().optional(),
  inmateId: z.string().trim().optional(),
  facilityName: z.string().trim().optional(),
  facilityState: z.string().trim().optional(),
  sentenceLength: z.string().trim().optional(),
  currentStatus: z.string().trim().optional(),
  arrestDate: z.string().optional(),
  arrestDateConfidence: confidence,
  convictionDate: z.string().optional(),
  convictionDateConfidence: confidence,
  paroleEligibilityDate: z.string().optional(),
  paroleEligibilityDateConfidence: confidence,
  paroleHearingDate: z.string().optional(),
  paroleHearingDateConfidence: confidence,
  expectedReleaseDate: z.string().optional(),
  expectedReleaseDateConfidence: confidence,
});

function dateOrNull(value: string | undefined) {
  return value && value.trim() ? value : null;
}

export async function updateLovedOneAction(
  familyId: string,
  lovedOneId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const data = parsed.data;

  let facilityId: string | null | undefined = undefined;
  if (data.facilityName && data.facilityState) {
    facilityId = await resolveFacility(data.facilityName, data.facilityState);
  }

  const updated = await updateLovedOne(familyId, lovedOneId, {
    name: data.name,
    preferredName: data.preferredName || null,
    inmateId: data.inmateId || null,
    ...(facilityId !== undefined ? { facilityId } : {}),
    state: data.facilityState || null,
    sentenceLength: data.sentenceLength || null,
    currentStatus: data.currentStatus || null,
    arrestDate: dateOrNull(data.arrestDate),
    arrestDateConfidence: data.arrestDateConfidence as DateConfidence,
    convictionDate: dateOrNull(data.convictionDate),
    convictionDateConfidence: data.convictionDateConfidence as DateConfidence,
    paroleEligibilityDate: dateOrNull(data.paroleEligibilityDate),
    paroleEligibilityDateConfidence: data.paroleEligibilityDateConfidence as DateConfidence,
    paroleHearingDate: dateOrNull(data.paroleHearingDate),
    paroleHearingDateConfidence: data.paroleHearingDateConfidence as DateConfidence,
    expectedReleaseDate: dateOrNull(data.expectedReleaseDate),
    expectedReleaseDateConfidence: data.expectedReleaseDateConfidence as DateConfidence,
  });

  if (!updated) return { success: false, error: "Loved one not found." };

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  return { success: true };
}

export async function deleteLovedOneAction(
  familyId: string,
  lovedOneId: string,
): Promise<{ success: boolean }> {
  await requireFamilyOwner(familyId);
  const removed = await deleteLovedOne(familyId, lovedOneId);
  revalidatePath(`/family/${familyId}`);
  return { success: Boolean(removed) };
}
