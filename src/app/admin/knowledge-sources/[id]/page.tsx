import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { knowledgeSourceIssueLinks, knowledgeSources } from "@/db/schema";
import { AUTHORITY_TIER_LABEL, KNOWLEDGE_SOURCE_KIND_LABEL } from "@/lib/knowledge-sources";
import { deleteKnowledgeSource, markKnowledgeSourceVerified, updateKnowledgeSource } from "../actions";
import { KnowledgeSourceFormFields } from "../knowledge-source-form";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function AdminKnowledgeSourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [source] = await db.select().from(knowledgeSources).where(eq(knowledgeSources.id, id)).limit(1);
  if (!source) notFound();

  const issueLinkRows = await db
    .select({ issueTag: knowledgeSourceIssueLinks.issueTag })
    .from(knowledgeSourceIssueLinks)
    .where(eq(knowledgeSourceIssueLinks.sourceId, id));

  const defaultValues = {
    title: source.title,
    sourceKind: source.sourceKind,
    authorityTier: String(source.authorityTier),
    jurisdiction: source.jurisdiction ?? "",
    citation: source.citation ?? "",
    organization: source.organization ?? "",
    summary: source.summary,
    url: source.url ?? "",
    verifiedBy: source.verifiedBy ?? "",
    status: source.status,
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            {KNOWLEDGE_SOURCE_KIND_LABEL[source.sourceKind] ?? source.sourceKind} ·{" "}
            {AUTHORITY_TIER_LABEL[source.authorityTier] ?? source.authorityTier}
          </p>
          <h1 className="mt-1 font-serif text-2xl text-foreground">{source.title}</h1>
          <p className="mt-1 text-xs text-muted">
            {source.lastVerifiedAt
              ? `Last verified ${DATE_FORMAT.format(source.lastVerifiedAt)}${source.verifiedBy ? ` by ${source.verifiedBy}` : ""}`
              : "Never marked verified"}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={markKnowledgeSourceVerified.bind(null, source.id)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground">
              Mark verified today
            </button>
          </form>
          <form action={deleteKnowledgeSource.bind(null, source.id)}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm text-red-600">
              Delete
            </button>
          </form>
        </div>
      </div>

      <form action={updateKnowledgeSource.bind(null, source.id)} className="mt-6 space-y-4">
        <KnowledgeSourceFormFields
          defaultValues={defaultValues}
          selectedIssueTags={issueLinkRows.map((r) => r.issueTag)}
          error={error}
        />
        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
