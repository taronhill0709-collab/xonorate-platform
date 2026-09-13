import { CaseAndIssueFields } from "@/app/admin/_components/case-issue-links";
import { Field, Select, TextArea, TextInput } from "@/app/admin/_components/field";
import { PhotoField, type LibraryPhotoOption } from "@/app/admin/_components/photo-field";
import { POST_TYPE_LABEL } from "@/lib/post-type";

export { SourceMaterialSection, type SourceMaterialItem } from "@/app/admin/_components/source-material";

export type PostFormDefaultValues = {
  type: string;
  title: string;
  body: string;
  whyThisMatters: string;
  whatToWatch: string;
  state: string;
  imageUrl: string;
};

export function PostFormFields({
  availableTypes,
  defaultValues,
  caseRows,
  selectedCaseIds,
  selectedIssueTags,
  libraryPhotos,
}: {
  availableTypes: string[];
  defaultValues: PostFormDefaultValues;
  caseRows: { id: string; clientName: string }[];
  selectedCaseIds: string[];
  selectedIssueTags: string[];
  libraryPhotos: LibraryPhotoOption[];
}) {
  return (
    <>
      <Field label="Content type" name="type">
        <Select id="type" name="type" defaultValue={defaultValues.type} required>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {POST_TYPE_LABEL[type] ?? type}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Headline" name="title">
        <TextInput id="title" name="title" defaultValue={defaultValues.title} required />
      </Field>

      <Field
        label="Photo (optional — shown as the article's thumbnail/header image; carried over from the source story when one was found, but you can replace it or pick from the shared library)"
        name="photo"
      >
        <PhotoField fieldName="imageUrl" defaultImageUrl={defaultValues.imageUrl} libraryPhotos={libraryPhotos} />
      </Field>

      <Field label="Body (Markdown)" name="body">
        <TextArea id="body" name="body" rows={12} defaultValue={defaultValues.body} required />
      </Field>

      <Field label="Why this matters (optional — an editorial-aid note, not part of the article body)" name="whyThisMatters">
        <TextArea id="whyThisMatters" name="whyThisMatters" rows={3} defaultValue={defaultValues.whyThisMatters} />
      </Field>

      <Field label="What to watch (optional — one follow-up per line)" name="whatToWatch">
        <TextArea id="whatToWatch" name="whatToWatch" rows={3} defaultValue={defaultValues.whatToWatch} />
      </Field>

      <Field label="State (optional)" name="state">
        <TextInput id="state" name="state" defaultValue={defaultValues.state} />
      </Field>

      <CaseAndIssueFields caseRows={caseRows} selectedCaseIds={selectedCaseIds} selectedIssueTags={selectedIssueTags} />
    </>
  );
}
