import { Field, FileInput, Select, SubmitButton, TextArea, TextInput } from "../../_components/field";
import { EVIDENCE_CATEGORY_FIELDS } from "@/lib/innocence-claim";
import { createCase } from "../actions";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ clientName?: string; state?: string; summary?: string }>;
}) {
  const prefill = await searchParams;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New case</h1>
      <form action={createCase} className="mt-6 space-y-4">
        <Field label="Client name" name="clientName">
          <TextInput
            id="clientName"
            name="clientName"
            defaultValue={prefill.clientName}
            required
          />
        </Field>
        <Field label="Slug (optional — generated from client name if left blank)" name="slug">
          <TextInput id="slug" name="slug" placeholder="e.g. richard-barge" />
        </Field>
        <Field label="State" name="state">
          <TextInput id="state" name="state" defaultValue={prefill.state} required />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue="awaiting_review" required>
            <option value="awaiting_review">Awaiting review</option>
            <option value="active_case">Active case</option>
            <option value="exonerated">Exonerated</option>
          </Select>
        </Field>
        <Field label="Summary" name="summary">
          <TextArea id="summary" name="summary" rows={4} defaultValue={prefill.summary} required />
        </Field>
        <Field label="Photo (optional)" name="photo">
          <FileInput
            id="photo"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">Conviction</h2>
        <Field label="Charge" name="charge">
          <TextInput id="charge" name="charge" required />
        </Field>
        <Field label="Year convicted" name="year">
          <TextInput id="year" name="year" type="number" required />
        </Field>
        <Field label="Sentence" name="sentence">
          <TextInput id="sentence" name="sentence" required />
        </Field>
        <Field label="Time served" name="timeServed">
          <TextInput id="timeServed" name="timeServed" />
        </Field>
        <Field label="What contributed to the conviction" name="contributingFactors">
          <TextArea id="contributingFactors" name="contributingFactors" rows={3} required />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Exoneration (leave blank if not yet exonerated)
        </h2>
        <Field label="What led to exoneration" name="exonerationSummary">
          <TextArea id="exonerationSummary" name="exonerationSummary" rows={3} />
        </Field>
        <Field label="Year exonerated" name="exonerationYear">
          <TextInput id="exonerationYear" name="exonerationYear" type="number" />
        </Field>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Full evidence dossier (optional — leave blank until attorney-confirmed detail exists)
        </h2>
        <Field label="Stat callouts — one per line, formatted &quot;value | label&quot;" name="stats">
          <TextArea
            id="stats"
            name="stats"
            rows={3}
            placeholder={"1 | eyewitness — who later recanted\n3 | alibi witnesses at the scene"}
          />
        </Field>
        <Field label="Pull quote" name="pullQuote">
          <TextArea id="pullQuote" name="pullQuote" rows={2} />
        </Field>
        {EVIDENCE_CATEGORY_FIELDS.map((f) => (
          <Field
            key={f.name}
            label={`${f.title} — one item per block: title line, then body, blank line between items`}
            name={f.name}
          >
            <TextArea id={f.name} name={f.name} rows={5} />
          </Field>
        ))}

        <SubmitButton>Create case</SubmitButton>
      </form>
    </div>
  );
}
