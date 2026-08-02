"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { caseDocuments, caseStatusEnum, cases, documentStatusEnum } from "@/db/schema";
import {
  type CaseImpact,
  type ImpactFacts,
  parseFactLines,
  parseImpactStats,
} from "@/lib/case-impact";
import { draftImpactNarrative } from "@/lib/impact-pipeline";
import {
  EVIDENCE_CATEGORY_TITLES,
  parseCategoryItems,
  parseStats,
} from "@/lib/innocence-claim";
import { InvalidCasePhotoError, uploadCasePhoto } from "@/lib/case-photo-storage";
import {
  extractCaseOverview,
  InvalidCaseDocumentError,
  type CaseOverviewDraft,
} from "@/lib/case-overview-extraction";
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
  photoUrl: z.string().optional().or(z.literal("")),
  stats: z.string().optional(),
  pullQuote: z.string().optional(),
  evidenceOfInnocence: z.string().optional(),
  newlyDiscoveredEvidence: z.string().optional(),
  dueProcessViolations: z.string().optional(),
  unreliableEvidence: z.string().optional(),
});

async function parseCaseForm(formData: FormData) {
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

  const categoryInputs = [
    parsed.evidenceOfInnocence,
    parsed.newlyDiscoveredEvidence,
    parsed.dueProcessViolations,
    parsed.unreliableEvidence,
  ];
  const categories = EVIDENCE_CATEGORY_TITLES.map((title, i) => ({
    title,
    items: parseCategoryItems(categoryInputs[i] ?? ""),
  })).filter((c) => c.items.length > 0);
  const stats = parseStats(parsed.stats ?? "");
  const pullQuote = parsed.pullQuote?.trim() || "";

  const innocenceClaim =
    stats.length > 0 || pullQuote || categories.length > 0
      ? { stats, pullQuote, categories }
      : null;

  // A newly uploaded file replaces the photo; otherwise the hidden
  // `photoUrl` field carries forward whatever the case already had.
  const photoFile = formData.get("photo");
  const photoUrl =
    photoFile instanceof File && photoFile.size > 0
      ? await uploadCasePhoto(photoFile)
      : parsed.photoUrl || null;

  return {
    clientName: parsed.clientName,
    slugInput: parsed.slug?.trim() || parsed.clientName,
    summary: parsed.summary,
    convictionDetails,
    timeServed: parsed.timeServed || null,
    exonerationDetails,
    status: parsed.status,
    state: parsed.state,
    photoUrl,
    innocenceClaim,
  };
}

export async function createCase(formData: FormData) {
  await requireAdmin();
  const data = await parseCaseForm(formData).catch((err) => {
    if (err instanceof InvalidCasePhotoError) {
      redirect(`/admin/cases/new?photoError=${encodeURIComponent(err.message)}`);
    }
    throw err;
  });

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
        innocenceClaim: data.innocenceClaim,
      })
      .returning({ id: cases.id }),
  );

  revalidatePath("/admin/cases");
  redirect(`/admin/cases/${row.id}/edit`);
}

export type ExtractCaseOverviewResult =
  | { ok: true; data: CaseOverviewDraft }
  | { ok: false; error: string };

/** Drafts the New Case form fields from an uploaded attorney case overview
 * PDF via Claude. Returns the draft to the client to review and edit —
 * nothing is saved here, so a bad extraction never reaches the database. */
export async function extractCaseOverviewAction(
  formData: FormData,
): Promise<ExtractCaseOverviewResult> {
  await requireAdmin();

  const file = formData.get("overview");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PDF to upload first." };
  }

  try {
    const data = await extractCaseOverview(file);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof InvalidCaseDocumentError) {
      return { ok: false, error: err.message };
    }
    console.error("extractCaseOverviewAction failed:", err);
    return { ok: false, error: "Something went wrong reading that document. Try again." };
  }
}

export async function updateCase(caseId: string, formData: FormData) {
  await requireAdmin();
  const data = await parseCaseForm(formData).catch((err) => {
    if (err instanceof InvalidCasePhotoError) {
      redirect(`/admin/cases/${caseId}/edit?photoError=${encodeURIComponent(err.message)}`);
    }
    throw err;
  });

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
      innocenceClaim: data.innocenceClaim,
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
  redirect(`/admin/cases/${caseId}/edit?saved=1`);
}

const impactFormSchema = z.object({
  ageAtArrest: z.string().optional(),
  maritalStatus: z.string().optional(),
  numberOfChildren: z.string().optional(),
  childrenAgesAtArrest: z.string().optional(),
  primaryCaregiver: z.string().optional(),
  occupationAtArrest: z.string().optional(),
  additionalFamilyFacts: z.string().optional(),
  communityRole: z.string().optional(),
  actualPerpetratorOutcome: z.string().optional(),
  additionalCommunityFacts: z.string().optional(),
  impactStats: z.string().optional(),
  familyImpact: z.string().optional(),
  communityImpact: z.string().optional(),
});

function parseImpactForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = impactFormSchema.parse(raw);

  const facts: ImpactFacts = {
    ageAtArrest: parsed.ageAtArrest ? Number(parsed.ageAtArrest) : null,
    maritalStatus: parsed.maritalStatus ?? "",
    numberOfChildren: parsed.numberOfChildren ? Number(parsed.numberOfChildren) : null,
    childrenAgesAtArrest: parsed.childrenAgesAtArrest?.trim() ?? "",
    primaryCaregiver: parsed.primaryCaregiver === "on",
    occupationAtArrest: parsed.occupationAtArrest?.trim() ?? "",
    additionalFamilyFacts: parseFactLines(parsed.additionalFamilyFacts ?? ""),
    communityRole: parsed.communityRole?.trim() ?? "",
    actualPerpetratorOutcome: parsed.actualPerpetratorOutcome?.trim() ?? "",
    additionalCommunityFacts: parseFactLines(parsed.additionalCommunityFacts ?? ""),
  };
  const stats = parseImpactStats(parsed.impactStats ?? "");

  return {
    facts,
    stats,
    familyImpact: parsed.familyImpact?.trim() ?? "",
    communityImpact: parsed.communityImpact?.trim() ?? "",
  };
}

/** null once every fact, stat, and narrative field is empty — same
 * "nothing gathered yet" convention as innocenceClaim. */
function impactOrNull(impact: CaseImpact): CaseImpact | null {
  const f = impact.facts;
  const hasFacts =
    f.ageAtArrest != null ||
    f.maritalStatus ||
    f.numberOfChildren != null ||
    f.childrenAgesAtArrest ||
    f.primaryCaregiver ||
    f.occupationAtArrest ||
    f.additionalFamilyFacts.length > 0 ||
    f.communityRole ||
    f.actualPerpetratorOutcome ||
    f.additionalCommunityFacts.length > 0;
  const hasContent =
    hasFacts || impact.stats.length > 0 || impact.familyImpact || impact.communityImpact;
  return hasContent ? impact : null;
}

/** Regenerates the family/community narrative from the submitted facts via
 * Claude, grounded strictly in those facts, and saves everything together. */
export async function generateCaseImpact(caseId: string, formData: FormData) {
  await requireAdmin();
  const { facts, stats } = parseImpactForm(formData);

  const [caseRow] = await db
    .select({ clientName: cases.clientName, slug: cases.slug })
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);
  if (!caseRow) throw new Error("Case not found");

  const draft = await draftImpactNarrative(caseRow.clientName, facts);

  await db
    .update(cases)
    .set({
      impact: impactOrNull({
        facts,
        stats,
        familyImpact: draft.familyImpact,
        communityImpact: draft.communityImpact,
      }),
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId));

  revalidatePath("/admin/cases");
  revalidatePath(`/admin/cases/${caseId}/edit`);
  revalidatePath(`/cases/${caseRow.slug}`);
  redirect(`/admin/cases/${caseId}/edit?saved=1`);
}

/** Saves facts, stats, and the (already-generated) narrative text as-is —
 * for fixing a typo in generated text without paying for a fresh
 * generation, or for saving facts before generating. */
export async function saveCaseImpact(caseId: string, formData: FormData) {
  await requireAdmin();
  const { facts, stats, familyImpact, communityImpact } = parseImpactForm(formData);

  await db
    .update(cases)
    .set({
      impact: impactOrNull({ facts, stats, familyImpact, communityImpact }),
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
  redirect(`/admin/cases/${caseId}/edit?saved=1`);
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
  redirect(`/admin/cases/${caseId}/edit?saved=1`);
}

export async function deleteDocument(caseId: string, documentId: string) {
  await requireAdmin();
  await db.delete(caseDocuments).where(eq(caseDocuments.id, documentId));
  revalidatePath(`/admin/cases/${caseId}/edit`);
  redirect(`/admin/cases/${caseId}/edit?saved=deleted`);
}

export async function updateCaseStatus(
  caseId: string,
  status: (typeof caseStatusEnum.enumValues)[number],
) {
  await requireAdmin();

  await db
    .update(cases)
    .set({ status, updatedAt: new Date() })
    .where(eq(cases.id, caseId));

  const [row] = await db
    .select({ slug: cases.slug })
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);

  revalidatePath("/admin/cases");
  if (row) revalidatePath(`/cases/${row.slug}`);
  redirect("/admin/cases?saved=1");
}

/** Moves a case one spot up or down in the admin/public display order.
 * Rewrites sortOrder for every case as its index in the new order rather
 * than swapping the two raw values, since most rows share the same
 * default (0) until the first reorder happens — a plain swap between two
 * equal values would silently do nothing. */
export async function moveCase(caseId: string, direction: "up" | "down") {
  await requireAdmin();

  const rows = await db
    .select({ id: cases.id })
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));
  const ids = rows.map((r) => r.id);

  const index = ids.indexOf(caseId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= ids.length) return;

  [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  await Promise.all(ids.map((id, i) => db.update(cases).set({ sortOrder: i }).where(eq(cases.id, id))));

  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  revalidatePath("/");
}

/** Deletes a case and, via FK cascade, its documents. Any petitions or
 * posts that referenced it are kept but unlinked (their caseId is set to
 * null by the schema's onDelete rule) rather than deleted along with it. */
export async function deleteCase(caseId: string) {
  await requireAdmin();
  await db.delete(cases).where(eq(cases.id, caseId));
  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  revalidatePath("/");
  redirect("/admin/cases?saved=deleted");
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
  redirect(`/admin/cases/${caseId}/edit?saved=1`);
}
