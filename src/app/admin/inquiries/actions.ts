"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  inquiries,
  inquiryDecisionLogs,
  inquiryInfoRequests,
  inquiryStatusEnum,
} from "@/db/schema";
import { INQUIRY_CRITERIA } from "@/lib/inquiry-criteria";
import { inquiryInfoPresetLabel } from "@/lib/inquiry-info-requests";
import { sendInquiryInfoRequestEmail } from "@/lib/inquiry-info-request-email";
import { getOrigin } from "@/lib/request-ip";
import { requireAdmin } from "@/lib/require-admin";

export async function setInquiryStatus(
  inquiryId: string,
  status: (typeof inquiryStatusEnum.enumValues)[number],
  formData?: FormData,
) {
  const session = await requireAdmin();
  const note = formData?.get("note");

  await db.update(inquiries).set({ status }).where(eq(inquiries.id, inquiryId));

  if (typeof note === "string" && note.trim()) {
    await db.insert(inquiryDecisionLogs).values({
      inquiryId,
      body: note.trim(),
      createdBy: session.user?.email ?? "unknown admin",
    });
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?saved=1`);
}

const requestMoreInfoSchema = z.object({
  items: z.array(z.string()).default([]),
  note: z.string().trim().max(2000).optional(),
});

export async function requestMoreInfo(inquiryId: string, formData: FormData) {
  const session = await requireAdmin();

  const items = formData.getAll("items").map((v) => String(v));
  const parsed = requestMoreInfoSchema.parse({
    items,
    note: formData.get("note")?.toString(),
  });
  const note = parsed.note?.trim() || null;

  if (parsed.items.length === 0 && !note) {
    redirect(`/admin/inquiries/${inquiryId}?error=select-at-least-one`);
  }

  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, inquiryId))
    .limit(1);
  if (!inquiry) redirect("/admin/inquiries");

  const followUpToken = crypto.randomBytes(24).toString("hex");

  await db.insert(inquiryInfoRequests).values({
    inquiryId,
    requestedItems: parsed.items,
    requestedNote: note,
    requestedBy: session.user?.email ?? "unknown admin",
  });

  await db
    .update(inquiries)
    .set({
      status: "needs_more_info",
      infoRequestedAt: new Date(),
      followUpToken,
    })
    .where(eq(inquiries.id, inquiryId));

  const origin = await getOrigin();
  const followUpUrl = `${origin}/follow-up/${followUpToken}`;
  const itemLabels = parsed.items.map(inquiryInfoPresetLabel);

  await sendInquiryInfoRequestEmail({
    to: inquiry.submitterEmail,
    submitterName: inquiry.submitterName,
    personName: inquiry.personName,
    itemLabels,
    note,
    followUpUrl,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?saved=1`);
}

export async function updateCriteriaChecklist(inquiryId: string, formData: FormData) {
  await requireAdmin();

  const checklist = Object.fromEntries(
    INQUIRY_CRITERIA.map((c) => [c.key, formData.get(c.key) === "on"]),
  );

  await db
    .update(inquiries)
    .set({ criteriaChecklist: checklist })
    .where(eq(inquiries.id, inquiryId));

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?saved=1`);
}

const decisionLogSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function addDecisionLogEntry(inquiryId: string, formData: FormData) {
  const session = await requireAdmin();
  const { body } = decisionLogSchema.parse(Object.fromEntries(formData.entries()));

  await db.insert(inquiryDecisionLogs).values({
    inquiryId,
    body,
    createdBy: session.user?.email ?? "unknown admin",
  });

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?saved=1`);
}
