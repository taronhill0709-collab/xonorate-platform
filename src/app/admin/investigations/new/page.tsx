import { desc, ne } from "drizzle-orm";
import { SourceMaterialSection, type SourceMaterialItem } from "@/app/admin/_components/source-material";
import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { cases, intelligenceItems, libraryPhotos } from "@/db/schema";
import { createInvestigation } from "../actions";
import { InvestigationFormFields } from "../investigation-form";

function toSourceMaterialItem(item: typeof intelligenceItems.$inferSelect): SourceMaterialItem {
  return {
    id: item.id,
    headline: item.headline,
    sourcePublication: item.sourcePublication,
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt,
  };
}

export default async function NewInvestigationPage({
  searchParams,
}: {
  searchParams: Promise<{ photoError?: string }>;
}) {
  const { photoError } = await searchParams;

  const [caseRows, candidateRows, libraryPhotoRows] = await Promise.all([
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
    db
      .select()
      .from(intelligenceItems)
      .where(ne(intelligenceItems.status, "rejected"))
      .orderBy(desc(intelligenceItems.createdAt))
      .limit(50),
    db.select({ id: libraryPhotos.id, url: libraryPhotos.url, label: libraryPhotos.label }).from(libraryPhotos).orderBy(desc(libraryPhotos.createdAt)),
  ]);

  const defaultValues = {
    title: "",
    subtitle: "",
    summary: "",
    thesis: "",
    body: "",
    status: "idea",
    heroImageUrl: "",
    isFeatured: false,
    editorialNotes: "",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New investigation</h1>
      <p className="mt-1 text-sm text-muted">
        Xonorate&apos;s highest editorial tier — reserve this for actual original investigative work, not
        an aggregated summary. Most discovered stories should become a News Brief, Case Development,
        or Analysis instead.
      </p>
      {photoError && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {photoError}
        </p>
      )}

      <form action={createInvestigation} className="mt-6 space-y-4">
        <SourceMaterialSection removableSources={[]} candidateSources={candidateRows.map(toSourceMaterialItem)} />

        <InvestigationFormFields
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={[]}
          selectedIssueTags={[]}
          libraryPhotos={libraryPhotoRows}
        />

        <SubmitButton>Create investigation</SubmitButton>
      </form>
    </div>
  );
}
