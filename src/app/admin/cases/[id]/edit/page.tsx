import { asc, desc, eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { caseDocuments, caseUpdates, caseVideos, cases } from "@/db/schema";
import {
  Field,
  FileInput,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import { NumberInput } from "../../../_components/number-input";
import { CONTRIBUTING_FACTOR_TAGS } from "@/lib/contributing-factors";
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
  addCaseUpdate,
  addCaseVideo,
  addDocument,
  deleteCaseUpdate,
  deleteCaseVideo,
  deleteDocument,
  generateCaseImpact,
  saveCaseImpact,
  setHomepageFeaturedVideo,
  toggleDocumentPublicSource,
  toggleDocumentStatus,
  unfeatureHomepageVideo,
  updateCase,
  updateCaseVideoMetrics,
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
  searchParams: Promise<{ photoError?: string; videoError?: string }>;
}) {
  const { id } = await params;
  const { photoError, videoError } = await searchParams;

  const [caseRow] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (!caseRow) notFound();

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, id))
    .orderBy(caseDocuments.sortOrder);

  const videos = await db
    .select()
    .from(caseVideos)
    .where(eq(caseVideos.caseId, id))
    .orderBy(asc(caseVideos.sortOrder), asc(caseVideos.createdAt));

  const updates = await db
    .select()
    .from(caseUpdates)
    .where(eq(caseUpdates.caseId, id))
    .orderBy(desc(caseUpdates.createdAt));

  const conviction = caseRow.convictionDetails as ConvictionDetails;
  const exoneration = caseRow.exonerationDetails as ExonerationDetails;
  const contributingFactorTags = (caseRow.contributingFactorTags as string[] | null) ?? [];
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
  const addCaseVideoWithId = addCaseVideo.bind(null, id);
  const addCaseUpdateWithId = addCaseUpdate.bind(null, id);

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
      {videoError && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {videoError}
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
        <Field
          label="Slug (the part of the URL after /cases/ — changing this updates the public URL; the old URL will keep working and redirect here automatically)"
          name="slug"
        >
          <TextInput id="slug" name="slug" defaultValue={caseRow.slug} required />
        </Field>
        <Field label="State" name="state">
          <TextInput id="state" name="state" defaultValue={caseRow.state} required />
        </Field>
        <Field label="County (optional)" name="county">
          <TextInput id="county" name="county" defaultValue={caseRow.county ?? ""} />
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
        <div className="flex items-center gap-2">
          <input
            id="isClient"
            name="isClient"
            type="checkbox"
            defaultChecked={caseRow.isClient}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="isClient" className="text-sm text-foreground">
            This is a Xonorate client (uncheck for a spotlight / awareness case we don&apos;t represent)
          </label>
        </div>
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
        <Field label="Source URL (optional — e.g. the National Registry of Exonerations profile this was drawn from)" name="sourceUrl">
          <TextInput id="sourceUrl" name="sourceUrl" type="url" defaultValue={caseRow.sourceUrl ?? ""} />
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
        <div>
          <label className="block text-sm font-medium text-foreground">
            Contributing factor tags (optional — standardized categories, shown as badges)
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CONTRIBUTING_FACTOR_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="contributingFactorTags"
                  value={tag}
                  defaultChecked={contributingFactorTags.includes(tag)}
                  className="h-4 w-4 rounded border-border"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <h2 className="pt-2 font-serif text-lg text-foreground">
          Demographics (optional — from NRE&apos;s &quot;Case Details&quot; box)
        </h2>
        <Field label="Race / ethnicity" name="raceEthnicity">
          <TextInput id="raceEthnicity" name="raceEthnicity" defaultValue={caseRow.raceEthnicity ?? ""} />
        </Field>
        <Field label="Sex" name="sex">
          <TextInput id="sex" name="sex" defaultValue={caseRow.sex ?? ""} />
        </Field>
        <Field label="Age at time of crime" name="ageAtCrime">
          <NumberInput id="ageAtCrime" name="ageAtCrime" defaultValue={caseRow.ageAtCrime ?? ""} />
        </Field>
        <Field label="Did DNA evidence contribute to the exoneration?" name="dnaInvolved">
          <Select
            id="dnaInvolved"
            name="dnaInvolved"
            defaultValue={caseRow.dnaInvolved === true ? "yes" : caseRow.dnaInvolved === false ? "no" : ""}
          >
            <option value="">Unknown / not documented</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
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
      <p className="mt-1 text-sm text-muted">
        Internal by default — most of these are attorney/court materials (affidavits, medical
        records, forensic reports) Xonorate doesn&apos;t publish. Mark a specific document
        &ldquo;Public source&rdquo; only when it&apos;s a genuine public citation (a news article,
        an official press release, the NRE profile) — those appear in the case page&apos;s
        &ldquo;Sources &amp; records&rdquo; section. Collection status is separate: it just tracks
        what Xonorate has actually collected versus what&apos;s still outstanding.
      </p>
      {documents.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No documents yet.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Collection status</th>
              <th className="py-2 font-medium">Public source?</th>
              <th className="py-2 font-medium">File</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-border">
                <td className="py-2 text-foreground">{doc.title}</td>
                <td className="py-2 text-foreground">
                  {doc.status === "on_file" ? "Collected" : "Outstanding"}
                </td>
                <td className="py-2 text-foreground">
                  {doc.isPublicSource ? (
                    <span className="font-medium text-brand">Public</span>
                  ) : (
                    <span className="text-muted">Private</span>
                  )}
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
                <td className="py-2 text-right whitespace-nowrap">
                  <form
                    action={toggleDocumentStatus.bind(null, id, doc.id)}
                    className="inline"
                  >
                    <button type="submit" className="text-brand underline">
                      Mark {doc.status === "on_file" ? "outstanding" : "collected"}
                    </button>
                  </form>{" "}
                  <form
                    action={toggleDocumentPublicSource.bind(null, id, doc.id)}
                    className="inline"
                  >
                    <button type="submit" className="text-brand underline">
                      Mark {doc.isPublicSource ? "private" : "public"}
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
            Collection status
          </label>
          <Select id="doc-status" name="status" defaultValue="needed">
            <option value="needed">Outstanding</option>
            <option value="on_file">Collected</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            id="doc-public"
            name="isPublicSource"
            type="checkbox"
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="doc-public" className="text-sm text-foreground">
            Public source (safe to cite on the case page)
          </label>
        </div>
        <div>
          <label htmlFor="doc-url" className="block text-sm font-medium text-foreground">
            File URL (optional)
          </label>
          <TextInput id="doc-url" name="fileUrl" type="url" />
        </div>
        <SubmitButton>Add document</SubmitButton>
      </form>

      <h2 className="mt-10 font-serif text-lg text-foreground">Top-performing videos</h2>
      <p className="mt-1 text-sm text-muted">
        Facebook/Instagram clips for this case, with engagement pulled by hand from Meta Business
        Suite. The top row is the main clip shown on the case page; the rest render as &ldquo;more
        clips.&rdquo; One video across the whole platform can be featured on the homepage.
      </p>
      {videos.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No videos yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {videos.map((video) => {
            const updateMetricsForVideo = updateCaseVideoMetrics.bind(null, id, video.id);
            return (
              <div key={video.id} className="rounded-md border border-border p-4">
                <div className="flex items-start gap-4">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt=""
                      width={72}
                      height={128}
                      className="h-32 w-[72px] shrink-0 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-32 w-[72px] shrink-0 items-center justify-center rounded border border-dashed border-border text-center text-[10px] text-muted">
                      No thumb
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{video.title}</p>
                    <p className="text-xs text-muted uppercase">
                      {video.platform}
                      {video.postedAt &&
                        ` · posted ${video.postedAt.toLocaleDateString("en-US")}`}
                    </p>
                    <a
                      href={video.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand underline"
                    >
                      Open post ↗
                    </a>

                    <form
                      action={updateMetricsForVideo}
                      className="mt-3 flex flex-wrap items-end gap-3"
                    >
                      <div className="w-24">
                        <label className="block text-xs font-medium text-foreground">Views</label>
                        <NumberInput name="views" defaultValue={video.views} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-foreground">Likes</label>
                        <NumberInput name="likes" defaultValue={video.likes} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-foreground">Shares</label>
                        <NumberInput name="shares" defaultValue={video.shares} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-foreground">
                          Comments
                        </label>
                        <NumberInput name="comments" defaultValue={video.comments} />
                      </div>
                      <div className="w-16">
                        <label className="block text-xs font-medium text-foreground">Order</label>
                        <NumberInput name="sortOrder" defaultValue={video.sortOrder} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground">
                          Posted on
                        </label>
                        <TextInput
                          name="postedAt"
                          type="date"
                          defaultValue={video.postedAt?.toISOString().slice(0, 10) ?? ""}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground">
                          {video.thumbnailUrl ? "Replace thumbnail" : "Add thumbnail"}
                        </label>
                        <FileInput
                          name="thumbnail"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted-background"
                      >
                        Update
                      </button>
                    </form>
                    {video.metricsUpdatedAt && (
                      <p className="mt-1 text-xs text-muted">
                        Metrics as of {video.metricsUpdatedAt.toLocaleDateString("en-US")}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {video.isHomepageFeatured ? (
                        <form action={unfeatureHomepageVideo.bind(null, id, video.id)}>
                          <button type="submit" className="text-xs text-brand underline">
                            ● Featured on homepage — remove
                          </button>
                        </form>
                      ) : (
                        <form action={setHomepageFeaturedVideo.bind(null, id, video.id)}>
                          <button type="submit" className="text-xs text-foreground underline">
                            Feature on homepage
                          </button>
                        </form>
                      )}
                      <form action={deleteCaseVideo.bind(null, id, video.id)}>
                        <button type="submit" className="text-xs text-red-600 underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        action={addCaseVideoWithId}
        className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-6"
      >
        <div>
          <label htmlFor="video-title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <TextInput id="video-title" name="title" placeholder="18 Years For Nothing" required />
        </div>
        <div>
          <label htmlFor="video-platform" className="block text-sm font-medium text-foreground">
            Platform
          </label>
          <Select id="video-platform" name="platform" defaultValue="instagram">
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </Select>
        </div>
        <div>
          <label htmlFor="video-url" className="block text-sm font-medium text-foreground">
            Post URL
          </label>
          <TextInput id="video-url" name="postUrl" type="url" required />
        </div>
        <div>
          <label htmlFor="video-posted-at" className="block text-sm font-medium text-foreground">
            Posted on (optional)
          </label>
          <TextInput id="video-posted-at" name="postedAt" type="date" />
        </div>
        <div>
          <label htmlFor="video-thumbnail" className="block text-sm font-medium text-foreground">
            Thumbnail (optional)
          </label>
          <FileInput
            id="video-thumbnail"
            name="thumbnail"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </div>
        <div className="w-24">
          <label htmlFor="video-views" className="block text-sm font-medium text-foreground">
            Views
          </label>
          <NumberInput id="video-views" name="views" defaultValue={0} />
        </div>
        <div className="w-24">
          <label htmlFor="video-likes" className="block text-sm font-medium text-foreground">
            Likes
          </label>
          <NumberInput id="video-likes" name="likes" defaultValue={0} />
        </div>
        <div className="w-24">
          <label htmlFor="video-shares" className="block text-sm font-medium text-foreground">
            Shares
          </label>
          <NumberInput id="video-shares" name="shares" defaultValue={0} />
        </div>
        <div className="w-24">
          <label htmlFor="video-comments" className="block text-sm font-medium text-foreground">
            Comments
          </label>
          <NumberInput id="video-comments" name="comments" defaultValue={0} />
        </div>
        <SubmitButton>Add video</SubmitButton>
      </form>

      <h2 className="mt-10 font-serif text-lg text-foreground">Case developments</h2>
      <p className="mt-1 text-sm text-muted">
        Chronological narrative updates shown in the case page&apos;s &ldquo;Case Developments&rdquo;
        feed. Hidden on the public page until at least one exists.
      </p>
      {updates.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No developments posted yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted">
                    {update.createdAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{update.headline}</p>
                  <p className="mt-1 text-sm text-muted">{update.body}</p>
                </div>
                <form action={deleteCaseUpdate.bind(null, id, update.id)}>
                  <button type="submit" className="shrink-0 text-xs text-red-600 underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={addCaseUpdateWithId} className="mt-6 space-y-3 border-t border-border pt-6">
        <Field label="Headline" name="headline">
          <TextInput id="headline" name="headline" required />
        </Field>
        <Field label="Description" name="body">
          <TextArea id="body" name="body" rows={3} required />
        </Field>
        <SubmitButton>Post development</SubmitButton>
      </form>
    </div>
  );
}
