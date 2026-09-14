import { CaseAndIssueFields } from "@/app/admin/_components/case-issue-links";
import { Field, Select, TextArea, TextInput } from "@/app/admin/_components/field";
import { POST_STATUS_LABEL } from "@/lib/post-type";
import {
  RESOURCE_AUDIENCES,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_LABEL,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABEL,
} from "@/lib/resource-taxonomy";

export type ResourceFormDefaultValues = {
  title: string;
  category: string;
  subcategory: string;
  resourceType: string;
  audiences: string[];
  state: string;
  organization: string;
  author: string;
  description: string;
  body: string;
  url: string;
  tags: string;
  featured: boolean;
  status: string;
};

export function ResourceFormFields({
  defaultValues,
  caseRows,
  selectedCaseIds,
  selectedIssueTags,
  error,
}: {
  defaultValues: ResourceFormDefaultValues;
  caseRows: { id: string; clientName: string }[];
  selectedCaseIds: string[];
  selectedIssueTags: string[];
  error?: string;
}) {
  return (
    <>
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <Field label="Title" name="title">
        <TextInput id="title" name="title" defaultValue={defaultValues.title} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" name="category">
          <Select id="category" name="category" defaultValue={defaultValues.category} required>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {RESOURCE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Resource type" name="resourceType">
          <Select id="resourceType" name="resourceType" defaultValue={defaultValues.resourceType} required>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Subcategory (optional — a free-text label shown under the category, e.g. 'False Confessions')" name="subcategory">
        <TextInput id="subcategory" name="subcategory" defaultValue={defaultValues.subcategory} />
      </Field>

      <Field label="Description (short — shown on the card)" name="description">
        <TextArea id="description" name="description" rows={2} defaultValue={defaultValues.description} required />
      </Field>

      <Field
        label="Body (Markdown, optional — populate for an internal Xonorate guide with its own detail page; leave blank for a pure external-link card)"
        name="body"
      >
        <TextArea id="body" name="body" rows={10} defaultValue={defaultValues.body} />
      </Field>

      <Field label="External URL (optional — required if Body is left blank)" name="url">
        <TextInput id="url" name="url" type="url" defaultValue={defaultValues.url} placeholder="https://" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Organization (optional)" name="organization">
          <TextInput id="organization" name="organization" defaultValue={defaultValues.organization} />
        </Field>
        <Field label="Author (optional)" name="author">
          <TextInput id="author" name="author" defaultValue={defaultValues.author} />
        </Field>
      </div>

      <Field label="State (optional)" name="state">
        <TextInput id="state" name="state" defaultValue={defaultValues.state} />
      </Field>

      <div>
        <label className="block text-sm font-medium text-foreground">Audiences (optional)</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RESOURCE_AUDIENCES.map((a) => (
            <label key={a.tag} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="audiences"
                value={a.tag}
                defaultChecked={defaultValues.audiences.includes(a.tag)}
                className="h-4 w-4 rounded border-border"
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <Field label="Tags (optional — one per line)" name="tags">
        <TextArea id="tags" name="tags" rows={3} defaultValue={defaultValues.tags} />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          name="featured"
          defaultChecked={defaultValues.featured}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="featured" className="text-sm font-medium text-foreground">
          Featured (shows in the Resource Center&apos;s Featured Resource band — setting this unfeatures any other resource)
        </label>
      </div>

      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={defaultValues.status} required>
          {Object.entries(POST_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <CaseAndIssueFields caseRows={caseRows} selectedCaseIds={selectedCaseIds} selectedIssueTags={selectedIssueTags} />
    </>
  );
}
