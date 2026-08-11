"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inquiries, inquiryFollowUps, inquiryInfoRequests } from "@/db/schema";
import { INQUIRY_INFO_PRESETS } from "@/lib/inquiry-info-requests";

export async function submitFollowUp(
  token: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.followUpToken, token))
    .limit(1);

  if (!inquiry) {
    return { success: false, error: "This link is no longer valid." };
  }

  const responses: Record<string, string> = {};
  for (const preset of INQUIRY_INFO_PRESETS) {
    const value = formData.get(preset.key);
    if (typeof value === "string" && value.trim()) responses[preset.key] = value.trim();
  }
  const other = formData.get("other");
  if (typeof other === "string" && other.trim()) responses.other = other.trim();

  if (Object.keys(responses).length === 0) {
    return { success: false, error: "Please fill in at least one field before submitting." };
  }

  const [latestRequest] = await db
    .select({ id: inquiryInfoRequests.id })
    .from(inquiryInfoRequests)
    .where(eq(inquiryInfoRequests.inquiryId, inquiry.id))
    .orderBy(desc(inquiryInfoRequests.createdAt))
    .limit(1);

  await db.insert(inquiryFollowUps).values({
    inquiryId: inquiry.id,
    requestId: latestRequest?.id ?? null,
    responses,
  });

  if (inquiry.status === "needs_more_info") {
    await db
      .update(inquiries)
      .set({ status: "under_review" })
      .where(eq(inquiries.id, inquiry.id));
  }

  return { success: true };
}
