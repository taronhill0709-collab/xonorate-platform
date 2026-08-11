import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Field, SubmitButton, TextArea } from "@/app/admin/_components/field";
import { db } from "@/db";
import {
  inquiries,
  inquiryDecisionLogs,
  inquiryFollowUps,
  inquiryInfoRequests,
} from "@/db/schema";
import { INQUIRY_CRITERIA } from "@/lib/inquiry-criteria";
import { INQUIRY_INFO_PRESETS, inquiryInfoPresetLabel } from "@/lib/inquiry-info-requests";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry-status";
import {
  addDecisionLogEntry,
  deleteInfoRequest,
  requestMoreInfo,
  setInquiryStatus,
  updateCriteriaChecklist,
} from "../actions";

function badgeTone(status: string): "brand" | "danger" | "neutral" {
  if (status === "accepted") return "brand";
  if (status === "declined") return "danger";
  return "neutral";
}

function formatDate(d: Date) {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminInquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  if (!inquiry) notFound();

  const infoRequests = await db
    .select()
    .from(inquiryInfoRequests)
    .where(eq(inquiryInfoRequests.inquiryId, id))
    .orderBy(desc(inquiryInfoRequests.createdAt));

  const followUps = await db
    .select()
    .from(inquiryFollowUps)
    .where(eq(inquiryFollowUps.inquiryId, id))
    .orderBy(desc(inquiryFollowUps.createdAt));

  const decisionLogs = await db
    .select()
    .from(inquiryDecisionLogs)
    .where(eq(inquiryDecisionLogs.inquiryId, id))
    .orderBy(desc(inquiryDecisionLogs.createdAt));

  const checklist = (inquiry.criteriaChecklist ?? {}) as Record<string, boolean>;

  const requestMoreInfoWithId = requestMoreInfo.bind(null, id);
  const updateChecklistWithId = updateCriteriaChecklist.bind(null, id);
  const addDecisionLogEntryWithId = addDecisionLogEntry.bind(null, id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/case-submissions" className="text-sm text-brand underline">
        ← All case submissions
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">
          {inquiry.personName} <span className="text-muted">· {inquiry.state}</span>
        </h1>
        <Badge tone={badgeTone(inquiry.status)}>
          {INQUIRY_STATUS_LABEL[inquiry.status] ?? inquiry.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        Submitted by {inquiry.submitterName} ({inquiry.submitterEmail}) —{" "}
        {inquiry.relationshipToPerson} — {formatDate(inquiry.createdAt)}
      </p>
      <p className="mt-4 whitespace-pre-line text-sm text-foreground">{inquiry.caseSummary}</p>

      {error === "select-at-least-one" && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Select at least one item or add a note before requesting more info.
        </p>
      )}

      {/* --- Status actions --- */}
      <div className="mt-6 flex flex-wrap gap-3 border-y border-border py-4">
        {inquiry.status !== "under_review" && (
          <form action={setInquiryStatus.bind(null, id, "under_review")}>
            <button type="submit" className="text-brand underline">
              Mark under review
            </button>
          </form>
        )}
        {inquiry.status !== "accepted" && (
          <form action={setInquiryStatus.bind(null, id, "accepted")}>
            <button type="submit" className="text-brand underline">
              Accept
            </button>
          </form>
        )}
        {inquiry.status !== "declined" && (
          <form action={setInquiryStatus.bind(null, id, "declined")}>
            <button type="submit" className="text-red-600 underline">
              Decline
            </button>
          </form>
        )}
        {inquiry.status === "accepted" && (
          <Link
            href={{
              pathname: "/admin/cases/new",
              query: {
                clientName: inquiry.personName,
                state: inquiry.state,
                summary: inquiry.caseSummary,
              },
            }}
            className="text-brand underline"
          >
            Create case from this inquiry
          </Link>
        )}
      </div>

      {/* --- Acceptance criteria checklist --- */}
      <h2 className="mt-8 font-serif text-lg text-foreground">Acceptance criteria</h2>
      <p className="mt-1 text-sm text-muted">Internal only — not shown to the submitter.</p>
      <form action={updateChecklistWithId} className="mt-3 space-y-2">
        {INQUIRY_CRITERIA.map((c) => (
          <label key={c.key} className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name={c.key}
              defaultChecked={Boolean(checklist[c.key])}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            {c.label}
          </label>
        ))}
        <SubmitButton>Save checklist</SubmitButton>
      </form>

      {/* --- Request more info --- */}
      <h2 className="mt-10 font-serif text-lg text-foreground">Request more info</h2>
      <p className="mt-1 text-sm text-muted">
        Emails the submitter, sets status to &quot;Needs more info&quot;, and logs the request
        below.
      </p>
      <form action={requestMoreInfoWithId} className="mt-3 space-y-3">
        {INQUIRY_INFO_PRESETS.map((preset) => (
          <label key={preset.key} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="items"
              value={preset.key}
              className="h-4 w-4 rounded border-border"
            />
            {preset.label}
          </label>
        ))}
        <Field label="Anything else to ask for (optional)" name="note">
          <TextArea id="note" name="note" rows={3} />
        </Field>
        <SubmitButton>Send request</SubmitButton>
      </form>

      {infoRequests.length > 0 && (
        <ul className="mt-4 space-y-3">
          {infoRequests.map((r) => (
            <li key={r.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-muted">
                  {formatDate(r.createdAt)} — requested by {r.requestedBy}
                </p>
                <form action={deleteInfoRequest.bind(null, id, r.id)}>
                  <button type="submit" className="shrink-0 text-xs text-red-600 underline">
                    Delete
                  </button>
                </form>
              </div>
              {Array.isArray(r.requestedItems) && r.requestedItems.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-foreground">
                  {(r.requestedItems as string[]).map((key) => (
                    <li key={key}>{inquiryInfoPresetLabel(key)}</li>
                  ))}
                </ul>
              )}
              {r.requestedNote && (
                <p className="mt-1 whitespace-pre-line text-foreground">{r.requestedNote}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* --- Follow-up responses --- */}
      {followUps.length > 0 && (
        <>
          <h2 className="mt-10 font-serif text-lg text-foreground">Follow-up responses</h2>
          <ul className="mt-3 space-y-3">
            {followUps.map((f) => {
              const responses = (f.responses ?? {}) as Record<string, string>;
              return (
                <li key={f.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="text-xs text-muted">{formatDate(f.createdAt)}</p>
                  <dl className="mt-1 space-y-2">
                    {Object.entries(responses)
                      .filter(([, value]) => value)
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="font-medium text-foreground">
                            {key === "other" ? "Anything else" : inquiryInfoPresetLabel(key)}
                          </dt>
                          <dd className="whitespace-pre-line text-foreground">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* --- Decision log --- */}
      <h2 className="mt-10 font-serif text-lg text-foreground">Decision log</h2>
      <p className="mt-1 text-sm text-muted">
        Internal, timestamped notes on why this submission was accepted, declined, or sent back
        for more info.
      </p>
      {decisionLogs.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {decisionLogs.map((log) => (
            <li key={log.id} className="rounded-md border border-border p-3 text-sm">
              <p className="text-xs text-muted">
                {formatDate(log.createdAt)} — {log.createdBy}
              </p>
              <p className="mt-1 whitespace-pre-line text-foreground">{log.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form action={addDecisionLogEntryWithId} className="mt-4 space-y-3">
        <Field label="Add a note" name="body">
          <TextArea id="body" name="body" rows={3} required />
        </Field>
        <SubmitButton>Add note</SubmitButton>
      </form>
    </div>
  );
}
