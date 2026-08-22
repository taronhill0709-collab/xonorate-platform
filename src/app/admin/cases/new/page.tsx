import { Field, FileInput, Select, SubmitButton, TextArea, TextInput } from "../../_components/field";
import { NumberInput } from "../../_components/number-input";
import { EVIDENCE_CATEGORY_FIELDS } from "@/lib/innocence-claim";
import { getCaseNreCandidate } from "@/lib/case-nre-candidates";
import { createCase, discardCaseCandidate } from "../actions";
import { ImportOverviewForm } from "../import-overview-form";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{
    clientName?: string;
    state?: string;
    summary?: string;
    photoError?: string;
    candidateId?: string;
  }>;
}) {
  const { candidateId, ...prefillParams } = await searchParams;
  const candidate = candidateId ? await getCaseNreCandidate(candidateId) : null;

  // A candidate drafted from NRE research takes priority when present;
  // otherwise fall back to the handful of fields the case-submission flow
  // passes through the URL.
  const clientNameDefault = candidate?.clientName ?? prefillParams.clientName;
  const stateDefault = candidate?.state ?? prefillParams.state;
  const summaryDefault = candidate?.summary ?? prefillParams.summary;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New case</h1>
      {prefillParams.photoError && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {prefillParams.photoError}
        </p>
      )}

      {candidate && candidateId && (
        <div className="mt-4 rounded-md border border-brand/40 bg-brand/5 px-4 py-3 text-sm">
          <p className="text-foreground">
            Drafted from a National Registry of Exonerations candidate — review every field below
            before saving.
          </p>
          <p className="mt-1 text-muted">
            Source:{" "}
            <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {candidate.sourceUrl}
            </a>
          </p>
          <form action={discardCaseCandidate.bind(null, candidateId)} className="mt-2">
            <button type="submit" className="text-red-400 underline">
              Discard this candidate
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <ImportOverviewForm />
      </div>

      <form action={createCase} className="space-y-4">
        {candidateId && <input type="hidden" name="candidateId" value={candidateId} />}
        <Field label="Client name" name="clientName">
          <TextInput
            id="clientName"
            name="clientName"
            defaultValue={clientNameDefault}
            required
          />
        </Field>
        <Field label="Slug (optional — generated from client name if left blank)" name="slug">
          <TextInput id="slug" name="slug" placeholder="e.g. richard-barge" />
        </Field>
        <Field label="State" name="state">
          <TextInput id="state" name="state" defaultValue={stateDefault} required />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={candidate ? "exonerated" : "awaiting_review"} required>
            <option value="awaiting_review">Awaiting review</option>
            <option value="active_case">Active case</option>
            <option value="exonerated">Exonerated</option>
          </Select>
        </Field>
        <Field label="Summary" name="summary">
          <TextArea id="summary" name="summary" rows={4} defaultValue={summaryDefault} required />
        </Field>
        <div className="flex items-center gap-2">
          <input
            id="isClient"
            name="isClient"
            type="checkbox"
            defaultChecked={!candidate}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="isClient" className="text-sm text-foreground">
            This is a Xonorate client (uncheck for a spotlight / awareness case we don&apos;t represent)
          </label>
        </div>
        <Field label="Photo (optional)" name="photo">
          <FileInput
            id="photo"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </Field>
        <Field label="Source URL (optional — e.g. the National Registry of Exonerations profile this was drawn from)" name="sourceUrl">
          <TextInput id="sourceUrl" name="sourceUrl" type="url" defaultValue={candidate?.sourceUrl} />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">Conviction</h2>
        <Field label="Charge" name="charge">
          <TextInput id="charge" name="charge" defaultValue={candidate?.charge} required />
        </Field>
        <Field label="Year convicted" name="year">
          <NumberInput id="year" name="year" defaultValue={candidate?.year} required />
        </Field>
        <Field label="Sentence" name="sentence">
          <TextInput id="sentence" name="sentence" defaultValue={candidate?.sentence} required />
        </Field>
        <Field label="Time served" name="timeServed">
          <TextInput id="timeServed" name="timeServed" defaultValue={candidate?.timeServed} />
        </Field>
        <Field label="What contributed to the conviction" name="contributingFactors">
          <TextArea
            id="contributingFactors"
            name="contributingFactors"
            rows={3}
            defaultValue={candidate?.contributingFactors}
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
            defaultValue={candidate?.exonerationSummary}
          />
        </Field>
        <Field label="Year exonerated" name="exonerationYear">
          <NumberInput id="exonerationYear" name="exonerationYear" defaultValue={candidate?.exonerationYear} />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Full evidence dossier (optional — leave blank until attorney-confirmed detail exists)
        </h2>
        <Field label="Stat callouts — one per line, formatted &quot;value | label&quot;" name="stats">
          <TextArea
            id="stats"
            name="stats"
            rows={3}
            defaultValue={candidate?.stats}
            placeholder={"1 | eyewitness — who later recanted\n3 | alibi witnesses at the scene"}
          />
        </Field>
        <Field label="Pull quote" name="pullQuote">
          <TextArea id="pullQuote" name="pullQuote" rows={2} defaultValue={candidate?.pullQuote} />
        </Field>
        {EVIDENCE_CATEGORY_FIELDS.map((f) => (
          <Field
            key={f.name}
            label={`${f.title} — one item per block: title line, then body, blank line between items`}
            name={f.name}
          >
            <TextArea id={f.name} name={f.name} rows={5} defaultValue={candidate?.[f.name]} />
          </Field>
        ))}

        <SubmitButton>Create case</SubmitButton>
      </form>
    </div>
  );
}
