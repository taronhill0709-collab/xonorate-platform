"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { inquiries, inquiryStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function setInquiryStatus(
  inquiryId: string,
  status: (typeof inquiryStatusEnum.enumValues)[number],
) {
  await requireAdmin();
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, inquiryId));
  revalidatePath("/admin/inquiries");
}
