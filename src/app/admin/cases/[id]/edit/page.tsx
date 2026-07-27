import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { caseDocuments, cases } from "@/db/schema";
import {
  Field,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import {
  EVIDENCE_CATEGORY_FIELDS,
  serializeCategoryItems,
  serializeStats,
  type InnocenceClaim,
} from "@/lib/innocence-claim";
import {
  addDocument,
  deleteDocument,
  toggleDocumentStatus,
  updateCase,
} from "../../actions";

type ConvictionDetails = {
  charge: string;
  year: number;
  sentence: string;
  contributingFactors: string;
};

type ExonerationDetails = {
  whatLedToExoneration: string;
  year: number;
} | null;

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [caseRow] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (!caseRow) notFound();

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, id))
    .orderBy(caseDocuments.sortOrder);

  const conviction = caseRow.convictionDetails as ConvictionDetails;
  const exoneration = caseRow.exonerationDetails as ExonerationDetails;
  const innocenceClaim = caseRow.innocenceClaim as InnocenceClaim | null;
  const categoryDefaults = EVIDENCE_CATEGORY_FIELDS.map((f) => {
    const category = innocenceClaim?.categories.find((c) => c.title === f.title);
    return category ? serializeCategoryItems(category.items) : "";
  });

  const updateCaseWithId = updateCase.bind(null, id);
  const addDocumentWithId = addDocument.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">
        Edit {caseRow.clientName}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Public page:{" "}
        <a href={`/cases/${caseRow.slug}`} className="underline">
          /cases/{caseRow.slug}
        </a>
      </p>

      <form action={updateCaseWithId} className="mt-6 space-y-4">
        <Field label="Client name" name="clientName">
          <TextInput
            id="clientName"
            name="clientName"
            defaultValue={caseRow.clientName}
            required
          />
        </Field>
        <Field label="State" name="state">
          <TextInput id="state" name="state" defaultValue={caseRow.state} required />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={caseRow.status} required>
            <option value="awaiting_review">Awaiting review</option>
            <option value="active_case">Active case</option>
            <option value="exonerated">Exonerated</option>
          </Select>
        </Field>
        <Field label="Summary" name="summary">
          <TextArea id="summary" name="summary" rows={4} defaultValue={caseRow.summary} required />
        </Field>
        <Field label="Photo URL (optional)" name="photoUrl">
          <TextInput
            id="photoUrl"
            name="photoUrl"
            type="url"
            defaultValue={caseRow.photoUrl ?? ""}
          />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">Conviction</h2>
        <Field label="Charge" name="charge">
          <TextInput id="charge" name="charge" defaultValue={conviction.charge} required />
        </Field>
        <Field label="Year convicted" name="year">
          <TextInput
            id="year"
            name="year"
            type="number"
            defaultValue={conviction.year}
            required
          />
        </Field>
        <Field label="Sentence" name="sentence">
          <TextInput id="sentence" name="sentence" defaultValue={conviction.sentence} required />
        </Field>
        <Field label="Time served" name="timeServed">
          <TextInput id="timeServed" name="timeServed" defaultValue={caseRow.timeServed ?? ""} />
        </Field>
        <Field label="What contributed to the conviction" name="contributingFactors">
          <TextArea
            id="contributingFactors"
            name="contributingFactors"
            rows={3}
            defaultValue={conviction.contributingFactors}
            required
          />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Exoneration (leave blank if not yet exonerated)
        </h2>
        <Field label="What led to exoneration" name="exonerationSummary">
          <TextArea
            id="exonerationSummary"
            name="exonerationSummary"
            rows={3}
            defaultValue={exoneration?.whatLedToExoneration ?? ""}
          />
        </Field>
        <Field label="Year exonerated" name="exonerationYear">
          <TextInput
            id="exonerationYear"
            name="exonerationYear"
            type="number"
            defaultValue={exoneration?.year ?? ""}
          />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Full evidence dossier (optional — leave blank until attorney-confirmed detail exists)
        </h2>
        <Field label="Stat callouts — one per line, formatted &quot;value | label&quot;" name="stats">
          <TextArea
            id="stats"
            name="stats"
            rows={3}
            defaultValue={innocenceClaim ? serializeStats(innocenceClaim.stats) : ""}
          />
        </Field>
        <Field label="Pull quote" name="pullQuote">
          <TextArea
            id="pullQuote"
            name="pullQuote"
            rows={2}
            defaultValue={innocenceClaim?.pullQuote ?? ""}
          />
        </Field>
        {EVIDENCE_CATEGORY_FIELDS.map((f, i) => (
          <Field
            key={f.name}
            label={`${f.title} — one item per block: title line, then body, blank line between items`}
            name={f.name}
          >
            <TextArea id={f.name} name={f.name} rows={5} defaultValue={categoryDefaults[i]} />
          </Field>
        ))}

        <SubmitButton>Save changes</SubmitButton>
      </form>

      <h2 className="mt-10 font-serif text-lg text-foreground">Documents</h2>
      {documents.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No documents yet.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">File</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-border">
                <td className="py-2 text-foreground">{doc.title}</td>
                <td className="py-2 text-foreground">
                  {doc.status === "on_file" ? "On file" : "Needed"}
                </td>
                <td className="py-2 text-foreground">
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} className="underline">
                      link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 text-right">
                  <form
                    action={toggleDocumentStatus.bind(null, id, doc.id)}
                    className="inline"
                  >
                    <button type="submit" className="text-brand underline">
                      Toggle
                    </button>
                  </form>{" "}
                  <form action={deleteDocument.bind(null, id, doc.id)} className="inline">
                    <button type="submit" className="text-red-600 underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={addDocumentWithId} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="doc-title" className="block text-sm font-medium text-foreground">
            New document title
          </label>
          <TextInput id="doc-title" name="title" required />
        </div>
        <div>
          <label htmlFor="doc-status" className="block text-sm font-medium text-foreground">
            Status
          </label>
          <Select id="doc-status" name="status" defaultValue="needed">
            <option value="needed">Needed</option>
            <option value="on_file">On file</option>
          </Select>
        </div>
        <div>
          <label htmlFor="doc-url" className="block text-sm font-medium text-foreground">
            File URL (optional)
          </label>
          <TextInput id="doc-url" name="fileUrl" type="url" />
        </div>
        <SubmitButton>Add document</SubmitButton>
      </form>
    </div>
  );
}
