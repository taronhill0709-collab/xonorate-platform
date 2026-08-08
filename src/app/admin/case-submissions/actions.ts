"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { inquiries, inquiryStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function setCaseSubmissionStatus(
  submissionId: string,
  status: (typeof inquiryStatusEnum.enumValues)[number],
) {
  await requireAdmin();
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, submissionId));
  revalidatePath("/admin/case-submissions");
  redirect("/admin/case-submissions?saved=1");
}
