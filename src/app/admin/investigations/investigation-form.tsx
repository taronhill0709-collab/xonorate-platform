import { CaseAndIssueFields } from "@/app/admin/_components/case-issue-links";
import { Field, Select, TextArea, TextInput } from "@/app/admin/_components/field";
import { investigationStatusEnum } from "@/db/schema";
import { INVESTIGATION_STATUS_LABEL } from "@/lib/investigation-status";

export type InvestigationFormDefaultValues = {
  title: string;
  subtitle: string;
  summary: string;
  thesis: string;
  body: string;
  status: string;
  heroImageUrl: string;
  editorialNotes: string;
};

export function InvestigationFormFields({
  defaultValues,
  caseRows,
  selectedCaseIds,
  selectedIssueTags,
}: {
  defaultValues: InvestigationFormDefaultValues;
  caseRows: { id: string; clientName: string }[];
  selectedCaseIds: string[];
  selectedIssueTags: string[];
}) {
  return (
    <>
      <Field label="Title" name="title">
        <TextInput id="title" name="title" defaultValue={defaultValues.title} required />
      </Field>

      <Field label="Subtitle (optional)" name="subtitle">
        <TextInput id="subtitle" name="subtitle" defaultValue={defaultValues.subtitle} />
      </Field>

      <Field label="Summary" name="summary">
        <TextArea id="summary" name="summary" rows={3} defaultValue={defaultValues.summary} required />
      </Field>

      <Field label="Thesis / central question (optional)" name="thesis">
        <TextArea id="thesis" name="thesis" rows={2} defaultValue={defaultValues.thesis} />
      </Field>

      <Field
        label="Body (Markdown) — the full narrative: what you found, the evidence, why it matters"
        name="body"
      >
        <TextArea id="body" name="body" rows={14} defaultValue={defaultValues.body} />
      </Field>

      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={defaultValues.status} required>
          {investigationStatusEnum.enumValues.map((status) => (
            <option key={status} value={status}>
              {INVESTIGATION_STATUS_LABEL[status] ?? status}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Hero image URL (optional)" name="heroImageUrl">
        <TextInput id="heroImageUrl" name="heroImageUrl" defaultValue={defaultValues.heroImageUrl} />
      </Field>

      <Field label="Editorial notes (internal — never shown publicly)" name="editorialNotes">
        <TextArea id="editorialNotes" name="editorialNotes" rows={3} defaultValue={defaultValues.editorialNotes} />
      </Field>

      <CaseAndIssueFields caseRows={caseRows} selectedCaseIds={selectedCaseIds} selectedIssueTags={selectedIssueTags} />
    </>
  );
}
