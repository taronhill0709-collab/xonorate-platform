"use server";

import { eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  intelligenceItems,
  investigationCaseLinks,
  investigationIssueLinks,
  investigationMaterialKindEnum,
  investigationMaterials,
  investigations,
  investigationStatusEnum,
  investigationTimelineEntries,
} from "@/db/schema";
import { InvalidCasePhotoError } from "@/lib/case-photo-storage";
import { attachContentSources, removeContentSourceRow } from "@/lib/content-sources";
import { requireAdmin } from "@/lib/require-admin";
import { resolvePhotoUpload } from "@/lib/resolve-photo-upload";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

const investigationFormSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  summary: z.string().min(1),
  thesis: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(investigationStatusEnum.enumValues),
  heroImageUrl: z.string().optional(),
  isFeatured: z.string().optional(),
  editorialNotes: z.string().optional(),
});

/** At most one investigation is featured at a time — unsets every other
 * row first, same "wholesale replace" approach as setCaseAndIssueLinks
 * below, so there's never ambiguity about which one the homepage/
 * Investigates "featured investigation" slot should show. */
async function setFeatured(investigationId: string, isFeatured: boolean) {
  if (!isFeatured) {
    await db.update(investigations).set({ isFeatured: false }).where(eq(investigations.id, investigationId));
    return;
  }
  await db.update(investigations).set({ isFeatured: false }).where(ne(investigations.id, investigationId));
  await db.update(investigations).set({ isFeatured: true }).where(eq(investigations.id, investigationId));
}

function parseInvestigationForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = investigationFormSchema.parse(raw);
  return {
    ...parsed,
    caseIds: formData.getAll("caseIds").map(String).filter(Boolean),
    issueTags: formData.getAll("issueTags").map(String).filter(Boolean),
    additionalSourceIds: formData.getAll("additionalSourceIds").map(String).filter(Boolean),
  };
}

/** Replaces an investigation's related-case/related-issue connections
 * wholesale — same simplest-correct approach as posts/actions.ts. */
async function setCaseAndIssueLinks(investigationId: string, caseIds: string[], issueTags: string[]) {
  await db.delete(investigationCaseLinks).where(eq(investigationCaseLinks.investigationId, investigationId));
  await db.delete(investigationIssueLinks).where(eq(investigationIssueLinks.investigationId, investigationId));
  if (caseIds.length > 0) {
    await db.insert(investigationCaseLinks).values(caseIds.map((caseId) => ({ investigationId, caseId })));
  }
  if (issueTags.length > 0) {
    await db.insert(investigationIssueLinks).values(issueTags.map((issueTag) => ({ investigationId, issueTag })));
  }
}

export async function createInvestigation(formData: FormData) {
  await requireAdmin();
  const data = parseInvestigationForm(formData);

  let heroImageUrl: string | null;
  try {
    heroImageUrl = await resolvePhotoUpload(formData, data.heroImageUrl);
  } catch (err) {
    if (err instanceof InvalidCasePhotoError) {
      redirect(`/admin/investigations/new?photoError=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  const row = await insertWithUniqueSlug(data.title, (slug) =>
    db
      .insert(investigations)
      .values({
        title: data.title,
        slug,
        subtitle: data.subtitle?.trim() || null,
        summary: data.summary,
        thesis: data.thesis?.trim() || null,
        body: data.body?.trim() || null,
        status: data.status,
        heroImageUrl,
        editorialNotes: data.editorialNotes?.trim() || null,
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning({ id: investigations.id }),
  );

  await attachContentSources("investigation", row.id, data.additionalSourceIds);
  await setCaseAndIssueLinks(row.id, data.caseIds, data.issueTags);
  await setFeatured(row.id, Boolean(data.isFeatured));

  revalidatePath("/admin/investigations");
  revalidatePath("/");
  revalidatePath("/news");
  redirect(`/admin/investigations/${row.id}?saved=1`);
}

export async function updateInvestigation(investigationId: string, formData: FormData) {
  await requireAdmin();
  const data = parseInvestigationForm(formData);

  // Only stamp publishedAt on the actual idea -> published transition — not
  // every subsequent edit while it stays published, which would otherwise
  // keep bumping the public date shown on the Investigates page.
  const [existing] = await db
    .select({ status: investigations.status, publishedAt: investigations.publishedAt })
    .from(investigations)
    .where(eq(investigations.id, investigationId))
    .limit(1);
  const publishedAt =
    data.status === "published" && existing?.status !== "published" ? new Date() : (existing?.publishedAt ?? null);

  let heroImageUrl: string | null;
  try {
    heroImageUrl = await resolvePhotoUpload(formData, data.heroImageUrl);
  } catch (err) {
    if (err instanceof InvalidCasePhotoError) {
      redirect(`/admin/investigations/${investigationId}?photoError=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  await db
    .update(investigations)
    .set({
      title: data.title,
      subtitle: data.subtitle?.trim() || null,
      summary: data.summary,
      thesis: data.thesis?.trim() || null,
      body: data.body?.trim() || null,
      status: data.status,
      heroImageUrl,
      editorialNotes: data.editorialNotes?.trim() || null,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(investigations.id, investigationId));

  await attachContentSources("investigation", investigationId, data.additionalSourceIds);
  await setCaseAndIssueLinks(investigationId, data.caseIds, data.issueTags);
  await setFeatured(investigationId, Boolean(data.isFeatured));

  revalidatePath("/admin/investigations");
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath(`/admin/investigations/${investigationId}`);
  redirect(`/admin/investigations/${investigationId}?saved=1`);
}

export async function deleteInvestigation(investigationId: string) {
  await requireAdmin();
  await db.delete(investigations).where(eq(investigations.id, investigationId));
  revalidatePath("/admin/investigations");
  redirect("/admin/investigations?saved=deleted");
}

export async function removeInvestigationSource(investigationId: string, contentSourceId: string) {
  await requireAdmin();
  await removeContentSourceRow(contentSourceId);
  revalidatePath(`/admin/investigations/${investigationId}`);
  revalidatePath("/admin/intelligence/sources");
}

// --- Timeline ---

const timelineEntrySchema = z.object({
  eventDate: z.string().optional(),
  title: z.string().min(1),
  body: z.string().optional(),
});

export async function addTimelineEntry(investigationId: string, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const data = timelineEntrySchema.parse(raw);

  const parsedDate = data.eventDate ? new Date(data.eventDate) : null;
  await db.insert(investigationTimelineEntries).values({
    investigationId,
    eventDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
    title: data.title,
    body: data.body?.trim() || null,
  });

  revalidatePath(`/admin/investigations/${investigationId}`);
  redirect(`/admin/investigations/${investigationId}?saved=1`);
}

export async function deleteTimelineEntry(investigationId: string, entryId: string) {
  await requireAdmin();
  await db.delete(investigationTimelineEntries).where(eq(investigationTimelineEntries.id, entryId));
  revalidatePath(`/admin/investigations/${investigationId}`);
  redirect(`/admin/investigations/${investigationId}?saved=deleted`);
}

// --- Materials (documents / interviews / data) ---

const materialSchema = z.object({
  kind: z.enum(investigationMaterialKindEnum.enumValues),
  title: z.string().min(1),
  fileUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  isPublicSource: z.string().optional(),
});

export async function addMaterial(investigationId: string, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const data = materialSchema.parse(raw);

  await db.insert(investigationMaterials).values({
    investigationId,
    kind: data.kind,
    title: data.title,
    fileUrl: data.fileUrl || null,
    notes: data.notes?.trim() || null,
    isPublicSource: Boolean(data.isPublicSource),
  });

  revalidatePath(`/admin/investigations/${investigationId}`);
  redirect(`/admin/investigations/${investigationId}?saved=1`);
}

export async function deleteMaterial(investigationId: string, materialId: string) {
  await requireAdmin();
  await db.delete(investigationMaterials).where(eq(investigationMaterials.id, materialId));
  revalidatePath(`/admin/investigations/${investigationId}`);
  redirect(`/admin/investigations/${investigationId}?saved=deleted`);
}

// --- Start from Xonorate Intelligence ---

/** The Investigation Builder's entry point from Xonorate Intelligence
 * (spec §12): "INTELLIGENCE ITEM → CREATE INVESTIGATION". Seeds a real
 * investigation from a discovered story — title/summary from the item,
 * its suggested case/issues carried over, the source attached — and sends
 * the editor straight to the new investigation's editor. Replaces the
 * earlier "flag in place" stub now that a real Investigation Builder
 * exists to send editors to. */
export async function startInvestigationFromIntelligence(itemId: string) {
  await requireAdmin();

  const [item] = await db.select().from(intelligenceItems).where(eq(intelligenceItems.id, itemId)).limit(1);
  if (!item) redirect("/admin/intelligence");

  const row = await insertWithUniqueSlug(item.headline, (slug) =>
    db
      .insert(investigations)
      .values({
        title: item.headline,
        slug,
        summary: item.summary,
        status: "idea",
      })
      .returning({ id: investigations.id }),
  );

  await attachContentSources("investigation", row.id, [item.id]);

  const issueTags = (item.issueTags as string[] | null) ?? [];
  await setCaseAndIssueLinks(row.id, item.suggestedCaseId ? [item.suggestedCaseId] : [], issueTags);

  revalidatePath("/admin/intelligence");
  revalidatePath("/admin/investigations");
  redirect(`/admin/investigations/${row.id}?saved=1`);
}
