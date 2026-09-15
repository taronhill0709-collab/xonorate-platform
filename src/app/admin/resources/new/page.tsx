import { and, asc, inArray } from "drizzle-orm";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { cases, investigations, knowledgeSources } from "@/db/schema";
import { PUBLICLY_CITABLE_SOURCE_STATUSES } from "@/lib/knowledge-sources";
import { createResource } from "../actions";
import { ResourceFormFields } from "../resource-form";

export default async function NewResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [caseRows, investigationRows, knowledgeSourceRows] = await Promise.all([
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
    db.select({ id: investigations.id, title: investigations.title }).from(investigations).orderBy(investigations.title),
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
  ]);

  const defaultValues = {
    title: "",
    category: "knowledge",
    subcategory: "",
    resourceType: "guide",
    audiences: [],
    state: "",
    organization: "",
    author: "",
    description: "",
    body: "",
    url: "",
    tags: "",
    featured: false,
    status: "pending",
    keyFactStat: "",
    keyFactLabel: "",
    keyFactSourceId: "",
    overview: "",
    whyItMatters: "",
    howItHappens: "",
    whatToKnow: "",
    whatToLookFor: "",
    questionsToAsk: "",
    whatYouCanDo: "",
    xonorateFindings: "",
    disclaimer: "",
    reviewedBy: "",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New resource</h1>
      <form action={createResource} className="mt-6 space-y-4">
        <ResourceFormFields
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={[]}
          selectedIssueTags={[]}
          investigationRows={investigationRows}
          selectedInvestigationIds={[]}
          knowledgeSourceRows={knowledgeSourceRows}
          selectedKnowledgeSourceIds={[]}
          error={error}
        />
        <SubmitButton>Create resource</SubmitButton>
      </form>
    </div>
  );
}
