import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { caseDocuments, cases } from "@/db/schema";
import {
  Field,
  FileInput,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import { NumberInput } from "../../../_components/number-input";
import {
  EMPTY_IMPACT_FACTS,
  serializeFactLines,
  serializeImpactStats,
  type CaseImpact,
} from "@/lib/case-impact";
import {
  EVIDENCE_CATEGORY_FIELDS,
  serializeCategoryItems,
  serializeStats,
  type InnocenceClaim,
} from "@/lib/innocence-claim";
import {
  addDocument,
  deleteDocument,
  generateCaseImpact,
  saveCaseImpact,
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photoError?: string }>;
}) {
  const { id } = await params;
  const { photoError } = await searchParams;

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
  const impact = caseRow.impact as CaseImpact | null;
  const facts = impact?.facts ?? EMPTY_IMPACT_FACTS;

  const updateCaseWithId = updateCase.bind(null, id);
  const addDocumentWithId = addDocument.bind(null, id);
  const generateCaseImpactWithId = generateCaseImpact.bind(null, id);
  const saveCaseImpactWithId = saveCaseImpact.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">
        Edit {caseRow.clientName}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Public page:{" "}
        <a href={`/cases/${caseRow.slug}`} className="underline">
          /cases/{caseRow.slug}
        </a>
      </p>

      {photoError && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {photoError}
        </p>
      )}

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
        <Field label="Photo (optional)" name="photo">
          {caseRow.photoUrl && (
            <Image
              src={caseRow.photoUrl}
              alt=""
              width={96}
              height={96}
              className="mb-2 h-24 w-24 rounded-md object-cover"
              unoptimized
            />
          )}
          <FileInput
            id="photo"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          <input type="hidden" name="photoUrl" value={caseRow.photoUrl ?? ""} />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">Conviction</h2>
        <Field label="Charge" name="charge">
          <TextInput id="charge" name="charge" defaultValue={conviction.charge} required />
        </Field>
        <Field label="Year convicted" name="year">
          <NumberInput id="year" name="year" defaultValue={conviction.year} required />
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
          <NumberInput id="exonerationYear" name="exonerationYear" defaultValue={exoneration?.year ?? ""} />
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

      <h2 className="mt-10 font-serif text-lg text-foreground">Human impact</h2>
      <p className="mt-1 text-sm text-muted">
        Enter what&apos;s known below — the two paragraphs are generated from these facts, not
        written by hand. Nothing is invented beyond what you enter here.
      </p>

      <form action={generateCaseImpactWithId} className="mt-6 space-y-4">
        <h3 className="font-serif text-base text-foreground">Family facts</h3>
        <Field label="Age at arrest" name="ageAtArrest">
          <NumberInput id="ageAtArrest" name="ageAtArrest" defaultValue={facts.ageAtArrest ?? ""} />
        </Field>
        <Field label="Marital status at arrest" name="maritalStatus">
          <Select id="maritalStatus" name="maritalStatus" defaultValue={facts.maritalStatus}>
            <option value="">Unknown</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </Select>
        </Field>
        <Field label="Number of children" name="numberOfChildren">
          <NumberInput
            id="numberOfChildren"
            name="numberOfChildren"
            defaultValue={facts.numberOfChildren ?? ""}
          />
        </Field>
        <Field label="Children's ages at arrest" name="childrenAgesAtArrest">
          <TextInput
            id="childrenAgesAtArrest"
            name="childrenAgesAtArrest"
            defaultValue={facts.childrenAgesAtArrest}
            placeholder="e.g. 3, 7, and 9"
          />
        </Field>
        <div className="flex items-center gap-2">
          <input
            id="primaryCaregiver"
            name="primaryCaregiver"
            type="checkbox"
            defaultChecked={facts.primaryCaregiver}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="primaryCaregiver" className="text-sm text-foreground">
            Was the primary income earner or caregiver for their family
          </label>
        </div>
        <Field label="Occupation at arrest" name="occupationAtArrest">
          <TextInput
            id="occupationAtArrest"
            name="occupationAtArrest"
            defaultValue={facts.occupationAtArrest}
          />
        </Field>
        <Field label="Other family facts — one per line" name="additionalFamilyFacts">
          <TextArea
            id="additionalFamilyFacts"
            name="additionalFamilyFacts"
            rows={3}
            defaultValue={serializeFactLines(facts.additionalFamilyFacts)}
            placeholder={"Wife left her nursing career to cover legal costs and visitation travel"}
          />
        </Field>

        <h3 className="pt-2 font-serif text-base text-foreground">Community facts</h3>
        <Field label="Role in the community before arrest" name="communityRole">
          <TextInput
            id="communityRole"
            name="communityRole"
            defaultValue={facts.communityRole}
            placeholder="e.g. Little league coach, deacon at First Baptist"
          />
        </Field>
        <Field label="What happened to the actual perpetrator" name="actualPerpetratorOutcome">
          <TextInput
            id="actualPerpetratorOutcome"
            name="actualPerpetratorOutcome"
            defaultValue={facts.actualPerpetratorOutcome}
            placeholder="e.g. Never identified; later convicted of two more robberies nearby"
          />
        </Field>
        <Field label="Other community facts — one per line" name="additionalCommunityFacts">
          <TextArea
            id="additionalCommunityFacts"
            name="additionalCommunityFacts"
            rows={3}
            defaultValue={serializeFactLines(facts.additionalCommunityFacts)}
          />
        </Field>

        <h3 className="pt-2 font-serif text-base text-foreground">Headline stats</h3>
        <Field
          label="Impact stat callouts — one per line, formatted &quot;value | label&quot;"
          name="impactStats"
        >
          <TextArea
            id="impactStats"
            name="impactStats"
            rows={3}
            defaultValue={impact ? serializeImpactStats(impact.stats) : ""}
            placeholder={"2 | children who grew up without their father\n$0 | compensation received to date"}
          />
        </Field>

        <h3 className="pt-2 font-serif text-base text-foreground">Generated narrative</h3>
        <p className="text-xs text-muted">
          Written by Claude from the facts above. Edit only to fix a generation mistake — not to
          add claims the facts above don&apos;t support.
        </p>
        <Field label="Impact on family" name="familyImpact">
          <TextArea
            id="familyImpact"
            name="familyImpact"
            rows={4}
            defaultValue={impact?.familyImpact ?? ""}
            placeholder="Not generated yet — fill in family facts above and click Generate."
          />
        </Field>
        <Field label="Impact on community" name="communityImpact">
          <TextArea
            id="communityImpact"
            name="communityImpact"
            rows={4}
            defaultValue={impact?.communityImpact ?? ""}
            placeholder="Not generated yet — fill in community facts above and click Generate."
          />
        </Field>

        <div className="flex gap-3">
          <SubmitButton>Generate narrative from facts</SubmitButton>
          <button
            type="submit"
            formAction={saveCaseImpactWithId}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted-background"
          >
            Save without regenerating
          </button>
        </div>
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
