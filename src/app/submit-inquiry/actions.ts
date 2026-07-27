"use server";

import { z } from "zod";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { isInquiryRateLimited } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const inquirySchema = z.object({
  submitterName: z.string().trim().min(1).max(120),
  submitterEmail: z.email(),
  relationshipToPerson: z.string().trim().min(1).max(120),
  personName: z.string().trim().min(1).max(120),
  caseSummary: z.string().trim().min(1).max(5000),
  state: z.string().trim().min(1).max(120),
});

export async function submitInquiry(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Please fill in all fields." };
  }

  const ip = await getClientIp();
  if (await isInquiryRateLimited(ip)) {
    return {
      success: false,
      error: "Too many submissions from this connection. Please try again later.",
    };
  }

  await db.insert(inquiries).values({ ...parsed.data, ipAddress: ip });

  return { success: true };
}
