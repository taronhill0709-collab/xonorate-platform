"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { generalInquiries } from "@/db/schema";
import { sendGeneralInquiryReplyEmail } from "@/lib/general-inquiry-reply-email";
import { requireAdmin } from "@/lib/require-admin";

export async function replyToGeneralInquiry(inquiryId: string, formData: FormData) {
  await requireAdmin();

  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) {
    redirect("/admin/inquiries?error=empty-reply");
  }

  const [row] = await db
    .select()
    .from(generalInquiries)
    .where(eq(generalInquiries.id, inquiryId))
    .limit(1);
  if (!row) {
    redirect("/admin/inquiries");
  }

  await sendGeneralInquiryReplyEmail({
    to: row.email,
    name: row.name,
    originalMessage: row.message,
    reply,
  });

  await db
    .update(generalInquiries)
    .set({ status: "responded", adminReply: reply, respondedAt: new Date() })
    .where(eq(generalInquiries.id, inquiryId));

  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries?saved=1");
}
