import { and, desc, eq, ne } from "drizzle-orm";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { cases, intelligenceItems, libraryPhotos } from "@/db/schema";
import type { ContentDraftInput } from "@/lib/content-draft";
import { CREATE_WITH_THIS_POST_TYPES } from "@/lib/intelligence";
import { createPost } from "../actions";
import { DraftBodyButton } from "../draft-body-button";
import { PostFormFields, SourceMaterialSection, type SourceMaterialItem } from "../post-form";

function toSourceMaterialItem(item: typeof intelligenceItems.$inferSelect): SourceMaterialItem {
  return {
    id: item.id,
    headline: item.headline,
    sourcePublication: item.sourcePublication,
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt,
  };
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ fromIntelligence?: string; type?: string; photoError?: string }>;
}) {
  const { fromIntelligence, type, photoError } = await searchParams;

  const [caseRows, sourceItem, libraryPhotoRows] = await Promise.all([
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
    fromIntelligence
      ? db
          .select()
          .from(intelligenceItems)
          .where(eq(intelligenceItems.id, fromIntelligence))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    db.select({ id: libraryPhotos.id, url: libraryPhotos.url, label: libraryPhotos.label }).from(libraryPhotos).orderBy(desc(libraryPhotos.createdAt)),
  ]);

  const candidateRows = await db
    .select()
    .from(intelligenceItems)
    .where(
      sourceItem
        ? and(ne(intelligenceItems.status, "rejected"), ne(intelligenceItems.id, sourceItem.id))
        : ne(intelligenceItems.status, "rejected"),
    )
    .orderBy(desc(intelligenceItems.createdAt))
    .limit(50);

  const resolvedType =
    type && (CREATE_WITH_THIS_POST_TYPES as readonly string[]).includes(type) ? type : CREATE_WITH_THIS_POST_TYPES[0];

  // Body starts as the bare source snippet — fast, no Claude call, so the
  // page always loads instantly. DraftBodyButton (client-side) upgrades it
  // to a real AI draft on demand via a background job; see that component
  // and startContentDraft (../actions.ts) for why this can't just run here
  // inline (a web-search-grounded Analysis/Explainer draft reliably takes
  // 20-40+ seconds, well past what a page render can wait on).
  const defaultValues = {
    type: resolvedType,
    title: sourceItem?.headline ?? "",
    body: sourceItem ? `${sourceItem.summary}\n\nSource: [${sourceItem.sourcePublication}](${sourceItem.sourceUrl})` : "",
    whyThisMatters: sourceItem?.whyThisMatters ?? "",
    whatToWatch: ((sourceItem?.whatToWatch as string[] | undefined) ?? []).join("\n"),
    state: sourceItem?.state ?? "",
    // Carries over the og:image already fetched from the source story at
    // discovery time (see fetchSourceImage in content-pipeline.ts) — a
    // real photo by default instead of nothing, still replaceable below.
    imageUrl: sourceItem?.sourceImageUrl ?? "",
  };

  const draftInput: Omit<ContentDraftInput, "type"> | null = sourceItem
    ? {
        headline: sourceItem.headline,
        sourcePublication: sourceItem.sourcePublication,
        sourceUrl: sourceItem.sourceUrl,
        summary: sourceItem.summary,
        whyThisMatters: sourceItem.whyThisMatters,
        issueTags: (sourceItem.issueTags as string[] | null) ?? [],
        caseName: sourceItem.suggestedCaseId
          ? (caseRows.find((c) => c.id === sourceItem.suggestedCaseId)?.clientName ?? null)
          : null,
      }
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New editorial content</h1>
      <p className="mt-1 text-sm text-muted">
        This creates a draft — it still needs Approve &amp; Publish from the post page before it goes
        live on the public site.
      </p>
      {photoError && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {photoError}
        </p>
      )}

      <form action={createPost} className="mt-6 space-y-4">
        {sourceItem && <input type="hidden" name="sourceIntelligenceItemId" value={sourceItem.id} />}

        <SourceMaterialSection
          primaryReadOnly={sourceItem ? toSourceMaterialItem(sourceItem) : undefined}
          removableSources={[]}
          candidateSources={candidateRows.map(toSourceMaterialItem)}
        />

        <DraftBodyButton baseInput={draftInput} />

        <PostFormFields
          availableTypes={[...CREATE_WITH_THIS_POST_TYPES]}
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={sourceItem?.suggestedCaseId ? [sourceItem.suggestedCaseId] : []}
          selectedIssueTags={(sourceItem?.issueTags as string[] | undefined) ?? []}
          libraryPhotos={libraryPhotoRows}
        />

        <SubmitButton>Create draft</SubmitButton>
      </form>
    </div>
  );
}
