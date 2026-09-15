import Link from "next/link";
import { CaseAndIssueFields } from "@/app/admin/_components/case-issue-links";
import { Field, Select, TextArea, TextInput } from "@/app/admin/_components/field";
import { AUTHORITY_TIER_LABEL, KNOWLEDGE_TOPICS } from "@/lib/knowledge-sources";
import { jurisdictionLabel } from "@/lib/jurisdictions";
import { POST_STATUS_LABEL } from "@/lib/post-type";
import {
  RESOURCE_AUDIENCES,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_LABEL,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABEL,
} from "@/lib/resource-taxonomy";

const VERIFIED_DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

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
  // Knowledge-hub fields — each blank/empty means "not populated yet,"
  // which hides the corresponding section on the public page rather than
  // showing something empty.
  keyFactStat: string;
  keyFactLabel: string;
  keyFactSourceId: string;
  overview: string;
  whyItMatters: string;
  howItHappens: string;
  whatToKnow: string;
  whatToLookFor: string;
  questionsToAsk: string; // newline-delimited, same convention as tags
  whatYouCanDo: string; // "Label | description | href" per line, description/href optional
  xonorateFindings: string;
  disclaimer: string;
  reviewedBy: string;
};

export type KnowledgeSourceOption = {
  id: string;
  title: string;
  authorityTier: number;
  jurisdiction: string | null;
  sourceKind: string;
  status: string;
  lastVerifiedAt: Date | null;
};

/** A labeled divider between the editor's logical sections (Basic
 * Information / Content / Research / Relationships / Editorial) — purely
 * visual, doesn't affect form submission. */
function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-t border-border pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <p className="text-xs font-bold tracking-widest text-brand uppercase">{title}</p>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
    </div>
  );
}

export function ResourceFormFields({
  defaultValues,
  caseRows,
  selectedCaseIds,
  selectedIssueTags,
  investigationRows,
  selectedInvestigationIds,
  knowledgeSourceRows,
  selectedKnowledgeSourceIds,
  warnings,
  error,
}: {
  defaultValues: ResourceFormDefaultValues;
  caseRows: { id: string; clientName: string }[];
  selectedCaseIds: string[];
  selectedIssueTags: string[];
  investigationRows: { id: string; title: string }[];
  selectedInvestigationIds: string[];
  knowledgeSourceRows: KnowledgeSourceOption[];
  selectedKnowledgeSourceIds: string[];
  warnings?: string[];
  error?: string;
}) {
  const selectedTopicTags = selectedIssueTags.filter((tag) => KNOWLEDGE_TOPICS.some((t) => t.tag === tag));

  return (
    <>
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {warnings && warnings.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          <p className="font-medium">Editorial checklist — not blocking, worth a look:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <SectionHeading title="Basic information" />

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

      <Field label="Description (short — shown on the card and as the page's editorial intro)" name="description">
        <TextArea id="description" name="description" rows={2} defaultValue={defaultValues.description} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Organization (optional)" name="organization">
          <TextInput id="organization" name="organization" defaultValue={defaultValues.organization} />
        </Field>
        <Field label="Author (optional)" name="author">
          <TextInput id="author" name="author" defaultValue={defaultValues.author} />
        </Field>
      </div>

      <Field label="State / jurisdiction (optional — free text, e.g. 'New Jersey')" name="state">
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

      <Field label="Tags (optional — one per line, used by search)" name="tags">
        <TextArea id="tags" name="tags" rows={3} defaultValue={defaultValues.tags} />
      </Field>

      <Field
        label="Body (Markdown, optional — legacy long-form content; new knowledge hubs should use the Content section below instead)"
        name="body"
      >
        <TextArea id="body" name="body" rows={6} defaultValue={defaultValues.body} />
      </Field>

      <Field label="External URL (optional — required if Body and Overview are both left blank)" name="url">
        <TextInput id="url" name="url" type="url" defaultValue={defaultValues.url} placeholder="https://" />
      </Field>

      <SectionHeading
        title="Content"
        description="The knowledge-hub sections a reader sees, in order. Leave any field blank to hide that section on the public page — never fill one in with a placeholder. Markdown supported: headings (##), paragraphs, bullets (-), numbered lists (1.), **bold**, *italic*, and [links](https://…)."
      />

      <Field label="Overview" name="overview">
        <TextArea id="overview" name="overview" rows={6} defaultValue={defaultValues.overview} />
      </Field>

      <Field label="Why it matters" name="whyItMatters">
        <TextArea id="whyItMatters" name="whyItMatters" rows={6} defaultValue={defaultValues.whyItMatters} />
      </Field>

      <Field label="How it happens" name="howItHappens">
        <TextArea id="howItHappens" name="howItHappens" rows={8} defaultValue={defaultValues.howItHappens} />
      </Field>

      <Field label="What to know" name="whatToKnow">
        <TextArea id="whatToKnow" name="whatToKnow" rows={8} defaultValue={defaultValues.whatToKnow} />
      </Field>

      <Field label="What to look for" name="whatToLookFor">
        <TextArea id="whatToLookFor" name="whatToLookFor" rows={8} defaultValue={defaultValues.whatToLookFor} />
      </Field>

      <Field label="Questions to ask (one per line, tailored to this topic — not a generic checklist)" name="questionsToAsk">
        <TextArea id="questionsToAsk" name="questionsToAsk" rows={6} defaultValue={defaultValues.questionsToAsk} />
      </Field>

      <Field
        label="What you can do (one per line, as: Label | description | link — description and link optional)"
        name="whatYouCanDo"
      >
        <TextArea
          id="whatYouCanDo"
          name="whatYouCanDo"
          rows={5}
          defaultValue={defaultValues.whatYouCanDo}
          placeholder={"Ask Xonorate | Explore this issue interactively. | /ask\nReview related Xonorate cases | | /cases"}
        />
      </Field>

      <SectionHeading title="Research" description="A single highlighted stat, and any documented Xonorate reporting connected to this issue." />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Key fact / stat (optional)" name="keyFactStat">
          <TextInput id="keyFactStat" name="keyFactStat" defaultValue={defaultValues.keyFactStat} placeholder="27.16%" />
        </Field>
        <Field label="Key fact label (optional)" name="keyFactLabel">
          <TextInput
            id="keyFactLabel"
            name="keyFactLabel"
            defaultValue={defaultValues.keyFactLabel}
            placeholder="of exonerations involve..."
          />
        </Field>
      </div>

      <Field label="Key fact source (only verified/approved sources are selectable)" name="keyFactSourceId">
        <Select id="keyFactSourceId" name="keyFactSourceId" defaultValue={defaultValues.keyFactSourceId}>
          <option value="">(no source)</option>
          {knowledgeSourceRows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="What Xonorate has found (only fill in when there's real documented Xonorate material — leave blank to hide the section)"
        name="xonorateFindings"
      >
        <TextArea id="xonorateFindings" name="xonorateFindings" rows={5} defaultValue={defaultValues.xonorateFindings} />
      </Field>

      <SectionHeading
        title="Relationships"
        description="Connections that power the Related Issues/Cases/Investigates sidebar and the Legal Framework/Research/Sources sections — pulled live from the knowledge graph, never typed in by hand."
      />

      <CaseAndIssueFields caseRows={caseRows} selectedCaseIds={selectedCaseIds} selectedIssueTags={selectedIssueTags} />

      <div>
        <label className="block text-sm font-medium text-foreground">
          Related knowledge topics (optional — procedural/research subjects like &quot;Post-conviction relief&quot; that
          aren&apos;t a cause of wrongful conviction, so they&apos;re not in the issues list above)
        </label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {KNOWLEDGE_TOPICS.map((topic) => (
            <label key={topic.tag} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="issueTags"
                value={topic.tag}
                defaultChecked={selectedTopicTags.includes(topic.tag)}
                className="h-4 w-4 rounded border-border"
              />
              {topic.tag}
            </label>
          ))}
        </div>
      </div>

      {investigationRows.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground">Related investigates (optional)</label>
          <select
            name="investigationIds"
            multiple
            defaultValue={selectedInvestigationIds}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            size={Math.min(6, Math.max(3, investigationRows.length))}
          >
            {investigationRows.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">Cmd/Ctrl-click to select multiple.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground">
          Knowledge sources (optional — powers &quot;What The Law Generally Says&quot;, &quot;Research &amp;
          Data&quot;, and &quot;Sources &amp; Further Reading&quot;. Only sources marked Verified or Approved are
          listed here — a draft or under-review source in{" "}
          <Link href="/admin/knowledge-sources" className="text-brand underline">
            Knowledge Sources
          </Link>{" "}
          isn&apos;t selectable until it clears review, so it can never silently become public authority.)
        </label>
        {knowledgeSourceRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No verified/approved knowledge sources exist yet.</p>
        ) : (
          <>
            <select
              name="knowledgeSourceIds"
              multiple
              defaultValue={selectedKnowledgeSourceIds}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              size={Math.min(12, Math.max(5, knowledgeSourceRows.length))}
            >
              {knowledgeSourceRows.map((s) => (
                <option key={s.id} value={s.id}>
                  {AUTHORITY_TIER_LABEL[s.authorityTier] ?? `Tier ${s.authorityTier}`} — {s.title}
                  {s.jurisdiction ? ` · ${jurisdictionLabel(s.jurisdiction)}` : ""}
                  {s.lastVerifiedAt ? ` · verified ${VERIFIED_DATE_FMT.format(s.lastVerifiedAt)}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Cmd/Ctrl-click to select multiple.</p>
          </>
        )}
      </div>

      <SectionHeading title="Editorial" description="Review status and publication controls." />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={defaultValues.status} required>
            {Object.entries(POST_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reviewed by (optional)" name="reviewedBy">
          <TextInput id="reviewedBy" name="reviewedBy" defaultValue={defaultValues.reviewedBy} placeholder="Xonorate Editorial / Research" />
        </Field>
      </div>

      <Field
        label="Disclaimer override (optional — leave blank to use the standard 'general information, not legal advice' disclaimer)"
        name="disclaimer"
      >
        <TextArea id="disclaimer" name="disclaimer" rows={2} defaultValue={defaultValues.disclaimer} />
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
    </>
  );
}
