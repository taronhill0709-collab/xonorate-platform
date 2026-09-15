"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { knowledgeSourceIssueLinks, knowledgeSourceKindEnum, knowledgeSources, knowledgeSourceStatusEnum } from "@/db/schema";
import { ISSUES } from "@/lib/issues";
import { KNOWLEDGE_TOPICS } from "@/lib/knowledge-sources";
import { requireAdmin } from "@/lib/require-admin";

// A knowledge source can be tagged with either a causal ISSUES tag or one
// of the broader KNOWLEDGE_TOPICS (see knowledge-source-form.tsx) — both
// are valid values for the same issueTags[] field.
const issueTags = new Set<string>([...ISSUES.map((i) => i.tag), ...KNOWLEDGE_TOPICS.map((t) => t.tag)]);

const formSchema = z.object({
  title: z.string().min(1),
  sourceKind: z.enum(knowledgeSourceKindEnum.enumValues),
  authorityTier: z.coerce.number().int().min(1).max(5),
  jurisdiction: z.string().optional(),
  citation: z.string().optional(),
  organization: z.string().optional(),
  summary: z.string().min(1),
  url: z.string().optional(),
  verifiedBy: z.string().optional(),
  status: z.enum(knowledgeSourceStatusEnum.enumValues),
});

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = formSchema.parse(raw);
  return {
    ...parsed,
    jurisdiction: parsed.jurisdiction?.trim() || null,
    citation: parsed.citation?.trim() || null,
    organization: parsed.organization?.trim() || null,
    url: parsed.url?.trim() || null,
    verifiedBy: parsed.verifiedBy?.trim() || null,
    issueTagList: formData.getAll("issueTags").map(String).filter((t) => issueTags.has(t)),
  };
}

async function setIssueLinks(sourceId: string, tags: string[]) {
  await db.delete(knowledgeSourceIssueLinks).where(eq(knowledgeSourceIssueLinks.sourceId, sourceId));
  if (tags.length > 0) {
    await db.insert(knowledgeSourceIssueLinks).values(tags.map((issueTag) => ({ sourceId, issueTag })));
  }
}

export async function createKnowledgeSource(formData: FormData) {
  await requireAdmin();
  let data: ReturnType<typeof parseForm>;
  try {
    data = parseForm(formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid form data.";
    redirect(`/admin/knowledge-sources/new?error=${encodeURIComponent(message)}`);
  }

  const [row] = await db
    .insert(knowledgeSources)
    .values({
      title: data.title,
      sourceKind: data.sourceKind,
      authorityTier: data.authorityTier,
      jurisdiction: data.jurisdiction,
      citation: data.citation,
      organization: data.organization,
      summary: data.summary,
      url: data.url,
      verifiedBy: data.verifiedBy,
      lastVerifiedAt: data.verifiedBy ? new Date() : null,
      status: data.status,
    })
    .returning({ id: knowledgeSources.id });

  await setIssueLinks(row.id, data.issueTagList);

  revalidatePath("/admin/knowledge-sources");
  redirect(`/admin/knowledge-sources/${row.id}?saved=1`);
}

export async function updateKnowledgeSource(sourceId: string, formData: FormData) {
  await requireAdmin();
  let data: ReturnType<typeof parseForm>;
  try {
    data = parseForm(formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid form data.";
    redirect(`/admin/knowledge-sources/${sourceId}?error=${encodeURIComponent(message)}`);
  }

  const [existing] = await db
    .select({ verifiedBy: knowledgeSources.verifiedBy, lastVerifiedAt: knowledgeSources.lastVerifiedAt })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, sourceId))
    .limit(1);

  await db
    .update(knowledgeSources)
    .set({
      title: data.title,
      sourceKind: data.sourceKind,
      authorityTier: data.authorityTier,
      jurisdiction: data.jurisdiction,
      citation: data.citation,
      organization: data.organization,
      summary: data.summary,
      url: data.url,
      verifiedBy: data.verifiedBy,
      lastVerifiedAt:
        data.verifiedBy && data.verifiedBy !== existing?.verifiedBy ? new Date() : existing?.lastVerifiedAt,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeSources.id, sourceId));

  await setIssueLinks(sourceId, data.issueTagList);

  revalidatePath("/admin/knowledge-sources");
  revalidatePath(`/admin/knowledge-sources/${sourceId}`);
  redirect(`/admin/knowledge-sources/${sourceId}?saved=1`);
}

export async function markKnowledgeSourceVerified(sourceId: string) {
  const session = await requireAdmin();
  await db
    .update(knowledgeSources)
    .set({ lastVerifiedAt: new Date(), verifiedBy: session.user?.name ?? session.user?.email ?? "Xonorate Editorial" })
    .where(eq(knowledgeSources.id, sourceId));
  revalidatePath(`/admin/knowledge-sources/${sourceId}`);
}

export async function deleteKnowledgeSource(sourceId: string) {
  await requireAdmin();
  await db.delete(knowledgeSources).where(eq(knowledgeSources.id, sourceId));
  revalidatePath("/admin/knowledge-sources");
  redirect("/admin/knowledge-sources?saved=deleted");
}
