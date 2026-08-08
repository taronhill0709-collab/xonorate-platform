"use server";

import { z } from "zod";
import { db } from "@/db";
import { generalInquiries } from "@/db/schema";
import { isGeneralInquiryRateLimited } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const generalInquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  message: z.string().trim().min(1).max(2000),
});

export async function submitGeneralInquiry(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = generalInquirySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Please fill in all fields." };
  }

  const ip = await getClientIp();
  if (await isGeneralInquiryRateLimited(ip)) {
    return {
      success: false,
      error: "Too many submissions from this connection. Please try again later.",
    };
  }

  await db.insert(generalInquiries).values({ ...parsed.data, ipAddress: ip });

  return { success: true };
}
