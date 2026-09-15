import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import {
  cases,
  investigations,
  knowledgeSources,
  resourceCaseLinks,
  resourceInvestigationLinks,
  resourceIssueLinks,
  resourceKnowledgeSourceLinks,
  resources,
} from "@/db/schema";
import { PUBLICLY_CITABLE_SOURCE_STATUSES } from "@/lib/knowledge-sources";
import { POST_STATUS_LABEL } from "@/lib/post-type";
import { RESOURCE_CATEGORY_LABEL, RESOURCE_TYPE_LABEL } from "@/lib/resource-taxonomy";
import { serializeWhatYouCanDo } from "@/lib/resource-what-you-can-do";
import { deleteResource, markResourceReviewed, updateResource } from "../actions";
import { ResourceFormFields } from "../resource-form";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Non-blocking editorial checklist — flags likely oversights without
 * making any field mandatory that existing shallow/link-card resources
 * legitimately don't need. */
function buildWarnings(
  resource: typeof resources.$inferSelect,
  relatedCaseCount: number,
  relatedInvestigationCount: number,
): string[] {
  const warnings: string[] = [];
  if (resource.status === "published" && !resource.overview && !resource.body) {
    warnings.push("Published with no Overview or Body — the page will render with very little content.");
  }
  if (resource.keyFactStat && !resource.keyFactSourceId) {
    warnings.push("Key fact has a stat but no source attached — the callout will show unsourced.");
  }
  if (resource.xonorateFindings && relatedCaseCount === 0 && relatedInvestigationCount === 0) {
    warnings.push("\"What Xonorate has found\" is filled in, but no cases or investigations are linked to it.");
  }
  return warnings;
}

export default async function AdminResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [resource] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (!resource) notFound();

  const [caseRows, caseLinkRows, issueLinkRows, investigationRows, investigationLinkRows, knowledgeSourceRows, knowledgeSourceLinkRows] =
    await Promise.all([
      db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
      db.select({ caseId: resourceCaseLinks.caseId }).from(resourceCaseLinks).where(eq(resourceCaseLinks.resourceId, id)),
      db.select({ issueTag: resourceIssueLinks.issueTag }).from(resourceIssueLinks).where(eq(resourceIssueLinks.resourceId, id)),
      db.select({ id: investigations.id, title: investigations.title }).from(investigations).orderBy(investigations.title),
      db
        .select({ investigationId: resourceInvestigationLinks.investigationId })
        .from(resourceInvestigationLinks)
        .where(eq(resourceInvestigationLinks.resourceId, id)),
      db
        .select({
          id: knowledgeSources.id,
          title: knowledgeSources.title,
          authorityTier: knowledgeSources.authorityTier,
          jurisdiction: knowledgeSources.jurisdiction,
          sourceKind: knowledgeSources.sourceKind,
          status: knowledgeSources.status,
          lastVerifiedAt: knowledgeSources.lastVerifiedAt,
        })
        .from(knowledgeSources)
        .where(and(inArray(knowledgeSources.status, PUBLICLY_CITABLE_SOURCE_STATUSES)))
        .orderBy(asc(knowledgeSources.authorityTier), asc(knowledgeSources.title)),
      db
        .select({ sourceId: resourceKnowledgeSourceLinks.sourceId })
        .from(resourceKnowledgeSourceLinks)
        .where(eq(resourceKnowledgeSourceLinks.resourceId, id)),
    ]);

  // A previously-linked source that has since been marked outdated/draft
  // again wouldn't appear in knowledgeSourceRows (which is filtered to
  // publicly-citable statuses) — add it back in explicitly so the editor
  // can see and remove it, rather than it silently vanishing from the form.
  const selectedKnowledgeSourceIds = knowledgeSourceLinkRows.map((r) => r.sourceId);
  const missingSelectedSourceIds = selectedKnowledgeSourceIds.filter((sid) => !knowledgeSourceRows.some((s) => s.id === sid));
  const extraSourceRows =
    missingSelectedSourceIds.length > 0
      ? await db
          .select({
            id: knowledgeSources.id,
            title: knowledgeSources.title,
            authorityTier: knowledgeSources.authorityTier,
            jurisdiction: knowledgeSources.jurisdiction,
            sourceKind: knowledgeSources.sourceKind,
            status: knowledgeSources.status,
            lastVerifiedAt: knowledgeSources.lastVerifiedAt,
          })
          .from(knowledgeSources)
          .where(inArray(knowledgeSources.id, missingSelectedSourceIds))
      : [];

  const defaultValues = {
    title: resource.title,
    category: resource.category,
    subcategory: resource.subcategory ?? "",
    resourceType: resource.resourceType,
    audiences: (resource.audiences as string[] | null) ?? [],
    state: resource.state ?? "",
    organization: resource.organization ?? "",
    author: resource.author ?? "",
    description: resource.description,
    body: resource.body ?? "",
    url: resource.url ?? "",
    tags: ((resource.tags as string[] | null) ?? []).join("\n"),
    featured: resource.featured,
    status: resource.status,
    keyFactStat: resource.keyFactStat ?? "",
    keyFactLabel: resource.keyFactLabel ?? "",
    keyFactSourceId: resource.keyFactSourceId ?? "",
    overview: resource.overview ?? "",
    whyItMatters: resource.whyItMatters ?? "",
    howItHappens: resource.howItHappens ?? "",
    whatToKnow: resource.whatToKnow ?? "",
    whatToLookFor: resource.whatToLookFor ?? "",
    questionsToAsk: ((resource.questionsToAsk as string[] | null) ?? []).join("\n"),
    whatYouCanDo: serializeWhatYouCanDo((resource.whatYouCanDo as { label: string; description?: string; href?: string }[] | null) ?? []),
    xonorateFindings: resource.xonorateFindings ?? "",
    disclaimer: resource.disclaimer ?? "",
    reviewedBy: resource.reviewedBy ?? "",
  };

  const warnings = buildWarnings(resource, caseLinkRows.length, investigationLinkRows.length);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            {RESOURCE_CATEGORY_LABEL[resource.category] ?? resource.category} ·{" "}
            {RESOURCE_TYPE_LABEL[resource.resourceType] ?? resource.resourceType} ·{" "}
            {POST_STATUS_LABEL[resource.status] ?? resource.status}
          </p>
          <h1 className="mt-1 font-serif text-2xl text-foreground">{resource.title}</h1>
          <p className="mt-1 text-xs text-muted">
            {resource.lastReviewedAt
              ? `Last reviewed ${DATE_FORMAT.format(resource.lastReviewedAt)}${resource.reviewedBy ? ` by ${resource.reviewedBy}` : ""}`
              : "Never marked reviewed"}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/resources/${resource.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
          >
            View public page ↗
          </a>
          <form action={markResourceReviewed.bind(null, resource.id)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground">
              Mark reviewed today
            </button>
          </form>
          <form action={deleteResource.bind(null, resource.id)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm text-red-600">
              Delete
            </button>
          </form>
        </div>
      </div>

      <form action={updateResource.bind(null, resource.id)} className="mt-6 space-y-4">
        <ResourceFormFields
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={caseLinkRows.map((r) => r.caseId)}
          selectedIssueTags={issueLinkRows.map((r) => r.issueTag)}
          investigationRows={investigationRows}
          selectedInvestigationIds={investigationLinkRows.map((r) => r.investigationId)}
          knowledgeSourceRows={[...knowledgeSourceRows, ...extraSourceRows]}
          selectedKnowledgeSourceIds={selectedKnowledgeSourceIds}
          warnings={warnings}
          error={error}
        />
        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
