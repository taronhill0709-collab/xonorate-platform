"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  postStatusEnum,
  resourceCaseLinks,
  resourceCategoryEnum,
  resourceIssueLinks,
  resources,
  resourceTypeEnum,
} from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { RESOURCE_AUDIENCES } from "@/lib/resource-taxonomy";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

const resourceFormSchema = z.object({
  title: z.string().min(1),
  category: z.enum(resourceCategoryEnum.enumValues),
  resourceType: z.enum(resourceTypeEnum.enumValues),
  subcategory: z.string().optional(),
  description: z.string().min(1),
  body: z.string().optional(),
  url: z.string().optional(),
  organization: z.string().optional(),
  author: z.string().optional(),
  state: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(postStatusEnum.enumValues),
});

const audienceTags = new Set<string>(RESOURCE_AUDIENCES.map((a) => a.tag));

function parseResourceForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = resourceFormSchema.parse(raw);

  const body = parsed.body?.trim() || undefined;
  const url = parsed.url?.trim() || undefined;
  if (!body && !url) {
    throw new Error("A resource needs either a Body or an external URL.");
  }

  return {
    ...parsed,
    body: body ?? null,
    url: url ?? null,
    subcategory: parsed.subcategory?.trim() || null,
    organization: parsed.organization?.trim() || null,
    author: parsed.author?.trim() || null,
    state: parsed.state?.trim() || null,
    tags: (parsed.tags ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    audiences: formData
      .getAll("audiences")
      .map(String)
      .filter((tag) => audienceTags.has(tag)),
    featured: formData.get("featured") === "on",
    caseIds: formData.getAll("caseIds").map(String).filter(Boolean),
    issueTags: formData.getAll("issueTags").map(String).filter(Boolean),
  };
}

/** Replaces a resource's related-case/related-issue connections wholesale —
 * same convention as posts/actions.ts's setCaseAndIssueLinks. */
async function setCaseAndIssueLinks(resourceId: string, caseIds: string[], issueTags: string[]) {
  await db.delete(resourceCaseLinks).where(eq(resourceCaseLinks.resourceId, resourceId));
  await db.delete(resourceIssueLinks).where(eq(resourceIssueLinks.resourceId, resourceId));
  if (caseIds.length > 0) {
    await db.insert(resourceCaseLinks).values(caseIds.map((caseId) => ({ resourceId, caseId })));
  }
  if (issueTags.length > 0) {
    await db.insert(resourceIssueLinks).values(issueTags.map((issueTag) => ({ resourceId, issueTag })));
  }
}

/** Clears featured off every other resource — "at most one featured" is
 * enforced here, not at the DB level, same as investigations.isFeatured. */
async function clearOtherFeatured(exceptId?: string) {
  const rows = exceptId
    ? await db.select({ id: resources.id }).from(resources).where(eq(resources.featured, true))
    : [];
  for (const row of rows) {
    if (row.id !== exceptId) {
      await db.update(resources).set({ featured: false }).where(eq(resources.id, row.id));
    }
  }
}

export async function createResource(formData: FormData) {
  await requireAdmin();

  let data: ReturnType<typeof parseResourceForm>;
  try {
    data = parseResourceForm(formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid form data.";
    redirect(`/admin/resources/new?error=${encodeURIComponent(message)}`);
  }

  const row = await insertWithUniqueSlug(data.title, (slug) =>
    db
      .insert(resources)
      .values({
        title: data.title,
        slug,
        category: data.category,
        subcategory: data.subcategory,
        resourceType: data.resourceType,
        audiences: data.audiences,
        state: data.state,
        organization: data.organization,
        author: data.author,
        description: data.description,
        body: data.body,
        url: data.url,
        tags: data.tags,
        featured: data.featured,
        status: data.status,
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning({ id: resources.id }),
  );

  if (data.featured) await clearOtherFeatured(row.id);
  await setCaseAndIssueLinks(row.id, data.caseIds, data.issueTags);

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath("/resources/browse");
  redirect(`/admin/resources/${row.id}?saved=1`);
}

export async function updateResource(resourceId: string, formData: FormData) {
  await requireAdmin();

  let data: ReturnType<typeof parseResourceForm>;
  try {
    data = parseResourceForm(formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid form data.";
    redirect(`/admin/resources/${resourceId}?error=${encodeURIComponent(message)}`);
  }

  const [existing] = await db
    .select({ status: resources.status, publishedAt: resources.publishedAt })
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  await db
    .update(resources)
    .set({
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      resourceType: data.resourceType,
      audiences: data.audiences,
      state: data.state,
      organization: data.organization,
      author: data.author,
      description: data.description,
      body: data.body,
      url: data.url,
      tags: data.tags,
      featured: data.featured,
      status: data.status,
      publishedAt: data.status === "published" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(resources.id, resourceId));

  if (data.featured) await clearOtherFeatured(resourceId);
  await setCaseAndIssueLinks(resourceId, data.caseIds, data.issueTags);

  revalidatePath("/admin/resources");
  revalidatePath(`/admin/resources/${resourceId}`);
  revalidatePath("/resources");
  revalidatePath("/resources/browse");
  redirect(`/admin/resources/${resourceId}?saved=1`);
}

export async function deleteResource(resourceId: string) {
  await requireAdmin();
  await db.delete(resources).where(eq(resources.id, resourceId));
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath("/resources/browse");
  redirect("/admin/resources?saved=deleted");
}

export async function markResourceReviewed(resourceId: string) {
  await requireAdmin();
  await db.update(resources).set({ lastReviewedAt: new Date() }).where(eq(resources.id, resourceId));
  revalidatePath(`/admin/resources/${resourceId}`);
  revalidatePath("/resources");
}

/** Rewrites every resource's sortOrder to match the given id order — same
 * pattern as posts/actions.ts's applyPostOrder. */
async function applyResourceOrder(orderedIds: string[]) {
  await Promise.all(orderedIds.map((id, i) => db.update(resources).set({ sortOrder: i }).where(eq(resources.id, id))));
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath("/resources/browse");
}

export async function setResourceOrder(orderedIds: string[]) {
  await requireAdmin();
  await applyResourceOrder(orderedIds);
}

export async function moveResource(resourceId: string, direction: "up" | "down") {
  await requireAdmin();

  const rows = await db
    .select({ id: resources.id })
    .from(resources)
    .orderBy(asc(resources.sortOrder), desc(resources.createdAt));
  const ids = rows.map((r) => r.id);

  const index = ids.indexOf(resourceId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= ids.length) return;

  [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  await applyResourceOrder(ids);
}
