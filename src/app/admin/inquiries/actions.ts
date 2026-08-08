"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { generalInquiries, generalInquiryStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function setGeneralInquiryStatus(
  inquiryId: string,
  status: (typeof generalInquiryStatusEnum.enumValues)[number],
) {
  await requireAdmin();
  await db.update(generalInquiries).set({ status }).where(eq(generalInquiries.id, inquiryId));
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries?saved=1");
}
