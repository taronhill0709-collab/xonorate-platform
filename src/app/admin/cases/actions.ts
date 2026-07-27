"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { caseDocuments, caseStatusEnum, cases, documentStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

const caseFormSchema = z.object({
  clientName: z.string().min(1),
  slug: z.string().optional(),
  summary: z.string().min(1),
  charge: z.string().min(1),
  year: z.coerce.number().int(),
  sentence: z.string().min(1),
  contributingFactors: z.string().min(1),
  timeServed: z.string().optional(),
  exonerationSummary: z.string().optional(),
  exonerationYear: z.coerce.number().int().optional(),
  status: z.enum(caseStatusEnum.enumValues),
  state: z.string().min(1),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

function parseCaseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = caseFormSchema.parse(raw);

  const convictionDetails = {
    charge: parsed.charge,
    year: parsed.year,
    sentence: parsed.sentence,
    contributingFactors: parsed.contributingFactors,
  };

  const exonerationDetails =
    parsed.exonerationSummary && parsed.exonerationYear
      ? { whatLedToExoneration: parsed.exonerationSummary, year: parsed.exonerationYear }
      : null;

  return {
    clientName: parsed.clientName,
    slugInput: parsed.slug?.trim() || parsed.clientName,
    summary: parsed.summary,
    convictionDetails,
    timeServed: parsed.timeServed || null,
    exonerationDetails,
    status: parsed.status,
    state: parsed.state,
    photoUrl: parsed.photoUrl || null,
  };
}

export async function createCase(formData: FormData) {
  await requireAdmin();
  const data = parseCaseForm(formData);

  const row = await insertWithUniqueSlug(data.slugInput, (slug) =>
    db
      .insert(cases)
      .values({
        clientName: data.clientName,
        slug,
        summary: data.summary,
        convictionDetails: data.convictionDetails,
        timeServed: data.timeServed,
        exonerationDetails: data.exonerationDetails,
        status: data.status,
        state: data.state,
        photoUrl: data.photoUrl,
      })
      .returning({ id: cases.id }),
  );

  revalidatePath("/admin/cases");
  redirect(`/admin/cases/${row.id}/edit`);
}

export async function updateCase(caseId: string, formData: FormData) {
  await requireAdmin();
  const data = parseCaseForm(formData);

  await db
    .update(cases)
    .set({
      clientName: data.clientName,
      summary: data.summary,
      convictionDetails: data.convictionDetails,
      timeServed: data.timeServed,
      exonerationDetails: data.exonerationDetails,
      status: data.status,
      state: data.state,
      photoUrl: data.photoUrl,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId));

  const [row] = await db
    .select({ slug: cases.slug })
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);

  revalidatePath("/admin/cases");
  revalidatePath(`/admin/cases/${caseId}/edit`);
  if (row) revalidatePath(`/cases/${row.slug}`);
  redirect(`/admin/cases/${caseId}/edit`);
}

const documentSchema = z.object({
  title: z.string().min(1),
  status: z.enum(documentStatusEnum.enumValues),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

export async function addDocument(caseId: string, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const data = documentSchema.parse(raw);

  await db.insert(caseDocuments).values({
    caseId,
    title: data.title,
    status: data.status,
    fileUrl: data.fileUrl || null,
  });

  revalidatePath(`/admin/cases/${caseId}/edit`);
}

export async function deleteDocument(caseId: string, documentId: string) {
  await requireAdmin();
  await db.delete(caseDocuments).where(eq(caseDocuments.id, documentId));
  revalidatePath(`/admin/cases/${caseId}/edit`);
}

export async function toggleDocumentStatus(caseId: string, documentId: string) {
  await requireAdmin();
  const [doc] = await db
    .select({ status: caseDocuments.status })
    .from(caseDocuments)
    .where(eq(caseDocuments.id, documentId))
    .limit(1);
  if (!doc) return;

  await db
    .update(caseDocuments)
    .set({ status: doc.status === "on_file" ? "needed" : "on_file" })
    .where(eq(caseDocuments.id, documentId));

  revalidatePath(`/admin/cases/${caseId}/edit`);
}
