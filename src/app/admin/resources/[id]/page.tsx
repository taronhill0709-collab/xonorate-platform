import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { cases, resourceCaseLinks, resourceIssueLinks, resources } from "@/db/schema";
import { POST_STATUS_LABEL } from "@/lib/post-type";
import { RESOURCE_CATEGORY_LABEL, RESOURCE_TYPE_LABEL } from "@/lib/resource-taxonomy";
import { deleteResource, markResourceReviewed, updateResource } from "../actions";
import { ResourceFormFields } from "../resource-form";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

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

  const [caseRows, caseLinkRows, issueLinkRows] = await Promise.all([
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
    db.select({ caseId: resourceCaseLinks.caseId }).from(resourceCaseLinks).where(eq(resourceCaseLinks.resourceId, id)),
    db.select({ issueTag: resourceIssueLinks.issueTag }).from(resourceIssueLinks).where(eq(resourceIssueLinks.resourceId, id)),
  ]);

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
  };

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
              ? `Last reviewed ${DATE_FORMAT.format(resource.lastReviewedAt)}`
              : "Never marked reviewed"}
          </p>
        </div>
        <div className="flex gap-2">
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
          error={error}
        />
        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
