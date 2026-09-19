"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FAMILY_CASE_STAGE_LABELS, FAMILY_CASE_STAGES, type FamilyCaseStage } from "@/family/case-overview-types";
import { generateCaseSummaryAction, updateCaseSnapshotAction } from "./actions";

export function CaseOverviewBoard({
  familyId,
  lovedOneId,
  caseLabel,
  caseNumber,
  jurisdiction,
  court,
  state,
  stage,
  charges,
  sentenceLength,
  currentStatus,
  facilityName,
  facilityState,
  attorneyName,
  attorneyOrganization,
}: {
  familyId: string;
  lovedOneId: string;
  caseLabel: string | null;
  caseNumber: string | null;
  jurisdiction: string | null;
  court: string | null;
  state: string | null;
  stage: FamilyCaseStage;
  charges: string | null;
  sentenceLength: string | null;
  currentStatus: string | null;
  facilityName: string | null;
  facilityState: string | null;
  attorneyName: string | null;
  attorneyOrganization: string | null;
}) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveStatus({ kind: "saving" });
    const formData = new FormData(e.currentTarget);
    const result = await updateCaseSnapshotAction(familyId, lovedOneId, formData);
    if (result.success) {
      setSaveStatus({ kind: "idle" });
      router.refresh();
    } else {
      setSaveStatus({ kind: "error", message: result.error });
    }
  }

  async function handleSummary() {
    setSummaryStatus("loading");
    const result = await generateCaseSummaryAction(familyId, lovedOneId);
    if (result.success) {
      setSummary(result.summary);
      setSummaryStatus("idle");
    } else {
      setSummaryStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-lg">Ask AI About This Case</h2>
          <button
            onClick={handleSummary}
            disabled={summaryStatus === "loading"}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {summaryStatus === "loading" ? "Thinking…" : "Summarize Where Things Stand"}
          </button>
        </div>
        {summaryStatus === "error" && (
          <p className="mt-3 text-sm text-brand" role="alert">
            Couldn&rsquo;t generate a summary right now — please try again.
          </p>
        )}
        {summary && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
            <p className="mt-3 text-xs text-muted">
              Generated with AI assistance from the timeline, documents, people, and issues you&rsquo;ve
              entered — not legal advice, and not a determination of guilt, innocence, or outcome.
            </p>
          </div>
        )}
      </section>

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">Case Snapshot</h2>
        <p className="mt-1 text-sm text-muted">
          Fill in what you know. Nothing here is required — leave a field blank rather than guessing.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="caseLabel" className="block text-sm font-medium">
              Case name/label <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="caseLabel"
              name="caseLabel"
              defaultValue={caseLabel ?? ""}
              placeholder="e.g. State v. Marcus Ellison"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="caseNumber" className="block text-sm font-medium">
              Case number <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="caseNumber"
              name="caseNumber"
              defaultValue={caseNumber ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="court" className="block text-sm font-medium">
              Court <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="court"
              name="court"
              defaultValue={court ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="jurisdiction" className="block text-sm font-medium">
              Jurisdiction <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="jurisdiction"
              name="jurisdiction"
              defaultValue={jurisdiction ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium">
              State <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="state"
              name="state"
              defaultValue={state ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="stage" className="block text-sm font-medium">
              Current stage
            </label>
            <select
              id="stage"
              name="stage"
              defaultValue={stage}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              {FAMILY_CASE_STAGES.map((value) => (
                <option key={value} value={value}>
                  {FAMILY_CASE_STAGE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sentenceLength" className="block text-sm font-medium">
              Sentence <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="sentenceLength"
              name="sentenceLength"
              defaultValue={sentenceLength ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="currentStatus" className="block text-sm font-medium">
              Case status <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="currentStatus"
              name="currentStatus"
              placeholder="e.g. incarcerated, on parole, released"
              defaultValue={currentStatus ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="charges" className="block text-sm font-medium">
            Charges <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="charges"
            name="charges"
            rows={2}
            defaultValue={charges ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Facility</p>
            <p className="mt-1 text-muted">
              {facilityName ? `${facilityName}${facilityState ? `, ${facilityState}` : ""}` : "Not on file"}
              {" — "}
              <Link href={`/family/${familyId}/loved-ones/${lovedOneId}/edit`} className="font-semibold text-brand">
                Edit in Loved One profile
              </Link>
            </p>
          </div>
          <div>
            <p className="font-medium">Attorney / primary legal contact</p>
            <p className="mt-1 text-muted">
              {attorneyName
                ? `${attorneyName}${attorneyOrganization ? ` (${attorneyOrganization})` : ""}`
                : "Not on file — "}
              {!attorneyName && (
                <Link href={`/family/${familyId}/loved-ones/${lovedOneId}/case/people/new`} className="font-semibold text-brand">
                  Add one
                </Link>
              )}
            </p>
          </div>
        </div>

        {saveStatus.kind === "error" && (
          <p className="mt-3 text-sm text-brand" role="alert">
            {saveStatus.message}
          </p>
        )}
        <button
          type="submit"
          disabled={saveStatus.kind === "saving"}
          className="mt-5 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {saveStatus.kind === "saving" ? "Saving…" : "Save Case Snapshot"}
        </button>
      </form>
    </div>
  );
}
