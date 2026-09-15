import { Field, Select, TextArea, TextInput } from "@/app/admin/_components/field";
import { ISSUES } from "@/lib/issues";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import {
  AUTHORITY_TIER_LABEL,
  AUTHORITY_TIERS,
  KNOWLEDGE_SOURCE_KIND_LABEL,
  KNOWLEDGE_SOURCE_KINDS,
  KNOWLEDGE_SOURCE_STATUS_LABEL,
  KNOWLEDGE_SOURCE_STATUSES,
  KNOWLEDGE_TOPICS,
} from "@/lib/knowledge-sources";

export type KnowledgeSourceFormDefaultValues = {
  title: string;
  sourceKind: string;
  authorityTier: string;
  jurisdiction: string;
  citation: string;
  organization: string;
  summary: string;
  url: string;
  verifiedBy: string;
  status: string;
};

export function KnowledgeSourceFormFields({
  defaultValues,
  selectedIssueTags,
  error,
}: {
  defaultValues: KnowledgeSourceFormDefaultValues;
  selectedIssueTags: string[];
  error?: string;
}) {
  return (
    <>
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <Field label="Title (e.g. &quot;Brady v. Maryland&quot; or &quot;National Registry of Exonerations&quot;)" name="title">
        <TextInput id="title" name="title" defaultValue={defaultValues.title} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Source kind" name="sourceKind">
          <Select id="sourceKind" name="sourceKind" defaultValue={defaultValues.sourceKind} required>
            {KNOWLEDGE_SOURCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {KNOWLEDGE_SOURCE_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Authority tier" name="authorityTier">
          <Select id="authorityTier" name="authorityTier" defaultValue={defaultValues.authorityTier} required>
            {AUTHORITY_TIERS.map((t) => (
              <option key={t} value={t}>
                {AUTHORITY_TIER_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Jurisdiction (optional — leave blank if not jurisdiction-specific)" name="jurisdiction">
        <Select id="jurisdiction" name="jurisdiction" defaultValue={defaultValues.jurisdiction}>
          <option value="">(not jurisdiction-specific)</option>
          {JURISDICTIONS.filter((j) => j.code !== "general").map((j) => (
            <option key={j.code} value={j.code}>
              {j.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Citation (optional — e.g. &quot;373 U.S. 83 (1963)&quot;)" name="citation">
        <TextInput id="citation" name="citation" defaultValue={defaultValues.citation} />
      </Field>

      <Field label="Publishing court / body / organization (optional)" name="organization">
        <TextInput id="organization" name="organization" defaultValue={defaultValues.organization} />
      </Field>

      <Field
        label="Summary — plain-language, human-written description of what this source actually says. This is the ONLY thing Ask Xonorate is allowed to paraphrase for this source."
        name="summary"
      >
        <TextArea id="summary" name="summary" rows={5} defaultValue={defaultValues.summary} required />
      </Field>

      <Field label="URL (optional)" name="url">
        <TextInput id="url" name="url" type="url" defaultValue={defaultValues.url} placeholder="https://" />
      </Field>

      <div>
        <label className="block text-sm font-medium text-foreground">Related causal issues (optional — what this source is about, when it's a contributing-factor topic)</label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ISSUES.map((issue) => (
            <label key={issue.tag} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="issueTags"
                value={issue.tag}
                defaultChecked={selectedIssueTags.includes(issue.tag)}
                className="h-4 w-4 rounded border-border"
              />
              {issue.title}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Related procedural/research topics (optional — for subjects like post-conviction relief that aren&apos;t a
          cause of wrongful conviction)
        </label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {KNOWLEDGE_TOPICS.map((topic) => (
            <label key={topic.tag} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="issueTags"
                value={topic.tag}
                defaultChecked={selectedIssueTags.includes(topic.tag)}
                className="h-4 w-4 rounded border-border"
              />
              {topic.tag}
            </label>
          ))}
        </div>
      </div>

      <Field label="Verified by (optional — setting/changing this stamps today's date)" name="verifiedBy">
        <TextInput id="verifiedBy" name="verifiedBy" defaultValue={defaultValues.verifiedBy} placeholder="Xonorate Editorial / Research" />
      </Field>

      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={defaultValues.status} required>
          {KNOWLEDGE_SOURCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {KNOWLEDGE_SOURCE_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
