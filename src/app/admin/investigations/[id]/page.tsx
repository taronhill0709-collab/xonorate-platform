import { and, asc, eq, ne, notInArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge, Field, Select, SubmitButton, TextArea, TextInput } from "@/app/admin/_components/field";
import { SourceMaterialSection, type SourceMaterialItem } from "@/app/admin/_components/source-material";
import { db } from "@/db";
import {
  cases,
  contentSources,
  intelligenceItems,
  investigationCaseLinks,
  investigationIssueLinks,
  investigationMaterialKindEnum,
  investigationMaterials,
  investigations,
  investigationTimelineEntries,
} from "@/db/schema";
import { INVESTIGATION_MATERIAL_KIND_LABEL, INVESTIGATION_STATUS_LABEL } from "@/lib/investigation-status";
import {
  addMaterial,
  addTimelineEntry,
  deleteInvestigation,
  deleteMaterial,
  deleteTimelineEntry,
  removeInvestigationSource,
  updateInvestigation,
} from "../actions";
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

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function AdminInvestigationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [investigation] = await db.select().from(investigations).where(eq(investigations.id, id)).limit(1);
  if (!investigation) notFound();

  const [caseRows, caseLinkRows, issueLinkRows, attachedSourceRows, timelineEntries, materials] = await Promise.all([
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName),
    db
      .select({ caseId: investigationCaseLinks.caseId })
      .from(investigationCaseLinks)
      .where(eq(investigationCaseLinks.investigationId, id)),
    db
      .select({ issueTag: investigationIssueLinks.issueTag })
      .from(investigationIssueLinks)
      .where(eq(investigationIssueLinks.investigationId, id)),
    db
      .select({ contentSourceId: contentSources.id, item: intelligenceItems })
      .from(contentSources)
      .innerJoin(intelligenceItems, eq(contentSources.intelligenceItemId, intelligenceItems.id))
      .where(and(eq(contentSources.targetType, "investigation"), eq(contentSources.targetId, id))),
    db
      .select()
      .from(investigationTimelineEntries)
      .where(eq(investigationTimelineEntries.investigationId, id))
      .orderBy(asc(investigationTimelineEntries.sortOrder), asc(investigationTimelineEntries.createdAt)),
    db
      .select()
      .from(investigationMaterials)
      .where(eq(investigationMaterials.investigationId, id))
      .orderBy(asc(investigationMaterials.sortOrder), asc(investigationMaterials.createdAt)),
  ]);

  const attachedItemIds = attachedSourceRows.map((r) => r.item.id);
  const candidateRows = await db
    .select()
    .from(intelligenceItems)
    .where(
      attachedItemIds.length > 0
        ? and(ne(intelligenceItems.status, "rejected"), notInArray(intelligenceItems.id, attachedItemIds))
        : ne(intelligenceItems.status, "rejected"),
    )
    .limit(50);

  const defaultValues = {
    title: investigation.title,
    subtitle: investigation.subtitle ?? "",
    summary: investigation.summary,
    thesis: investigation.thesis ?? "",
    body: investigation.body ?? "",
    status: investigation.status,
    heroImageUrl: investigation.heroImageUrl ?? "",
    editorialNotes: investigation.editorialNotes ?? "",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            {INVESTIGATION_STATUS_LABEL[investigation.status] ?? investigation.status}
          </p>
          <h1 className="mt-1 font-serif text-2xl text-foreground">{investigation.title}</h1>
        </div>
        <form action={deleteInvestigation.bind(null, investigation.id)}>
          <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm text-red-600">
            Delete
          </button>
        </form>
      </div>

      <form action={updateInvestigation.bind(null, investigation.id)} className="mt-6 space-y-4">
        <SourceMaterialSection
          removableSources={attachedSourceRows.map((r) => ({
            contentSourceId: r.contentSourceId,
            item: toSourceMaterialItem(r.item),
          }))}
          candidateSources={candidateRows.map(toSourceMaterialItem)}
          removeAction={removeInvestigationSource.bind(null, investigation.id)}
        />

        <InvestigationFormFields
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={caseLinkRows.map((r) => r.caseId)}
          selectedIssueTags={issueLinkRows.map((r) => r.issueTag)}
        />

        <SubmitButton>Save changes</SubmitButton>
      </form>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-foreground">The timeline</h2>
        <p className="mt-1 text-sm text-muted">Relevant events this investigation has documented so far.</p>

        {timelineEntries.length > 0 && (
          <ul className="mt-4 space-y-3">
            {timelineEntries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {entry.eventDate && (
                      <p className="text-xs font-medium uppercase tracking-wide text-brand">
                        {DATE_FORMAT.format(entry.eventDate)}
                      </p>
                    )}
                    <p className="mt-0.5 font-medium text-foreground">{entry.title}</p>
                    {entry.body && <p className="mt-1 text-sm text-muted">{entry.body}</p>}
                  </div>
                  <form action={deleteTimelineEntry.bind(null, investigation.id, entry.id)}>
                    <button type="submit" className="shrink-0 text-xs text-red-400 underline">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addTimelineEntry.bind(null, investigation.id)} className="mt-4 space-y-3 rounded-lg border border-border p-4">
          <p className="font-mono text-[11px] font-bold tracking-widest text-label uppercase">Add timeline entry</p>
          <Field label="Date (optional — leave blank if not yet pinned down)" name="eventDate">
            <TextInput id="eventDate" name="eventDate" type="date" />
          </Field>
          <Field label="Title" name="timelineTitle">
            <TextInput id="timelineTitle" name="title" required />
          </Field>
          <Field label="Details (optional)" name="timelineBody">
            <TextArea id="timelineBody" name="body" rows={2} />
          </Field>
          <SubmitButton>Add entry</SubmitButton>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-foreground">Documents, interviews &amp; data</h2>
        <p className="mt-1 text-sm text-muted">
          Working materials for this investigation. Most aren&apos;t meant to be published verbatim —
          mark a specific item as a public source only when it should be.
        </p>

        {materials.length > 0 && (
          <ul className="mt-4 space-y-2">
            {materials.map((material) => (
              <li key={material.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge>{INVESTIGATION_MATERIAL_KIND_LABEL[material.kind] ?? material.kind}</Badge>
                    {material.isPublicSource && <Badge tone="brand">Public source</Badge>}
                  </div>
                  <p className="mt-1 font-medium text-foreground">{material.title}</p>
                  {material.notes && <p className="mt-1 text-sm text-muted">{material.notes}</p>}
                  {material.fileUrl && (
                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-brand underline">
                      Open file →
                    </a>
                  )}
                </div>
                <form action={deleteMaterial.bind(null, investigation.id, material.id)}>
                  <button type="submit" className="shrink-0 text-xs text-red-400 underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addMaterial.bind(null, investigation.id)} className="mt-4 space-y-3 rounded-lg border border-border p-4">
          <p className="font-mono text-[11px] font-bold tracking-widest text-label uppercase">Add material</p>
          <Field label="Kind" name="kind">
            <Select id="kind" name="kind" defaultValue="document" required>
              {investigationMaterialKindEnum.enumValues.map((kind) => (
                <option key={kind} value={kind}>
                  {INVESTIGATION_MATERIAL_KIND_LABEL[kind] ?? kind}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title" name="title">
            <TextInput id="materialTitle" name="title" required />
          </Field>
          <Field label="File URL (optional)" name="fileUrl">
            <TextInput id="fileUrl" name="fileUrl" placeholder="https://…" />
          </Field>
          <Field label="Notes (optional)" name="notes">
            <TextArea id="notes" name="notes" rows={2} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="isPublicSource" value="true" className="h-4 w-4 rounded border-border" />
            Public source — okay to reference on the eventual public investigation page
          </label>
          <SubmitButton>Add material</SubmitButton>
        </form>
      </section>
    </div>
  );
}
