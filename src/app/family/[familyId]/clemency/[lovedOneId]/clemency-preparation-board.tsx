"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CLEMENCY_NARRATIVE_STATUS_LABELS, type ClemencyNarrativeStatus } from "@/family/clemency-preparation-types";
import {
  addAccomplishmentAction,
  deleteAccomplishmentAction,
  generateAttorneyQuestionsAction,
  generateMissingDocumentationAction,
  generateNarrativeAction,
  saveEditsAndApproveAction,
  saveNarrativeAction,
} from "./actions";

type Accomplishment = { id: string; title: string; description: string | null; achievedDate: string | null };

type NarrativeStatus = { kind: "idle" } | { kind: "generating" } | { kind: "saving" } | { kind: "error"; message: string };

export function ClemencyPreparationBoard({
  familyId,
  lovedOneId,
  narrativeContent,
  narrativeStatus,
  attorneyQuestionsContent,
  accomplishments,
  chronologyCount,
}: {
  familyId: string;
  lovedOneId: string;
  narrativeContent: string | null;
  narrativeStatus: ClemencyNarrativeStatus;
  attorneyQuestionsContent: string | null;
  accomplishments: Accomplishment[];
  chronologyCount: number;
}) {
  const router = useRouter();
  const [editableNarrative, setEditableNarrative] = useState(narrativeContent ?? "");
  const [status, setStatus] = useState<NarrativeStatus>({ kind: "idle" });

  const [accTitle, setAccTitle] = useState("");
  const [accDescription, setAccDescription] = useState("");
  const [accDate, setAccDate] = useState("");
  const [accSaving, setAccSaving] = useState(false);

  const [missingDocs, setMissingDocs] = useState<{ summary: string; likelyMissing: string[] } | null>(null);
  const [missingDocsStatus, setMissingDocsStatus] = useState<"idle" | "loading" | "error">("idle");

  const [questions, setQuestions] = useState(attorneyQuestionsContent ?? "");
  const [questionsStatus, setQuestionsStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleGenerateNarrative() {
    if (narrativeContent) {
      const proceed = confirm("This will replace the current draft with a fresh one. Continue?");
      if (!proceed) return;
    }
    setStatus({ kind: "generating" });
    const result = await generateNarrativeAction(familyId, lovedOneId);
    if (result.success) {
      router.refresh();
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleSaveEdits() {
    setStatus({ kind: "saving" });
    await saveNarrativeAction(familyId, lovedOneId, editableNarrative);
    setStatus({ kind: "idle" });
    router.refresh();
  }

  async function handleApprove() {
    setStatus({ kind: "saving" });
    await saveEditsAndApproveAction(familyId, lovedOneId, editableNarrative);
    setStatus({ kind: "idle" });
    router.refresh();
  }

  async function handleAddAccomplishment(e: React.FormEvent) {
    e.preventDefault();
    if (!accTitle.trim()) return;
    setAccSaving(true);
    await addAccomplishmentAction(familyId, lovedOneId, {
      title: accTitle.trim(),
      description: accDescription.trim() || null,
      achievedDate: accDate || null,
    });
    setAccTitle("");
    setAccDescription("");
    setAccDate("");
    setAccSaving(false);
    router.refresh();
  }

  async function handleDeleteAccomplishment(id: string) {
    await deleteAccomplishmentAction(familyId, lovedOneId, id);
    router.refresh();
  }

  async function handleCheckDocumentation() {
    setMissingDocsStatus("loading");
    const result = await generateMissingDocumentationAction(familyId, lovedOneId);
    if (result.success) {
      setMissingDocs({ summary: result.summary, likelyMissing: result.likelyMissing });
      setMissingDocsStatus("idle");
    } else {
      setMissingDocsStatus("error");
    }
  }

  async function handleGenerateQuestions() {
    setQuestionsStatus("loading");
    const result = await generateAttorneyQuestionsAction(
      familyId,
      lovedOneId,
      editableNarrative || null,
      missingDocs?.likelyMissing ?? [],
    );
    if (result.success) {
      setQuestions(result.questions);
      setQuestionsStatus("idle");
    } else {
      setQuestionsStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Narrative */}
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg">Draft Narrative</h2>
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
            {CLEMENCY_NARRATIVE_STATUS_LABELS[narrativeStatus]}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Drafted with AI assistance from the chronology, accomplishments, and support network below. Read
          it over, personalize it, and make sure everything is accurate before using it anywhere — this is
          drafting help, not legal advice.
        </p>
        <textarea
          value={editableNarrative}
          onChange={(e) => setEditableNarrative(e.target.value)}
          rows={12}
          placeholder="Generate a draft, or write your own narrative here."
          className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed focus:border-brand focus:outline-none"
        />
        {status.kind === "error" && (
          <p className="mt-2 text-sm text-brand" role="alert">
            {status.message}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleGenerateNarrative}
            disabled={status.kind === "generating"}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {status.kind === "generating" ? "Drafting…" : narrativeContent ? "Regenerate Draft" : "Generate Draft"}
          </button>
          <button
            onClick={handleSaveEdits}
            disabled={status.kind === "saving"}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {status.kind === "saving" ? "Saving…" : "Save Edits"}
          </button>
          <button
            onClick={handleApprove}
            disabled={status.kind === "saving"}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {narrativeStatus === "approved" ? "Approved ✓" : "Approve"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Rehabilitation accomplishments */}
        <section className="rounded-2xl border border-border bg-muted-background p-5">
          <h3 className="font-serif text-base">Rehabilitation Accomplishments</h3>
          <ul className="mt-3 space-y-2">
            {accomplishments.map((a) => (
              <li key={a.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && <p className="mt-0.5 text-xs text-muted">{a.description}</p>}
                    {a.achievedDate && <p className="mt-0.5 text-xs text-muted">{a.achievedDate}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteAccomplishment(a.id)}
                    className="shrink-0 text-xs text-muted transition hover:text-brand"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddAccomplishment} className="mt-3 space-y-2">
            <input
              value={accTitle}
              onChange={(e) => setAccTitle(e.target.value)}
              placeholder="e.g. Completed GED"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <textarea
              value={accDescription}
              onChange={(e) => setAccDescription(e.target.value)}
              placeholder="Details (optional)"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <input
              type="date"
              value={accDate}
              onChange={(e) => setAccDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={accSaving || !accTitle.trim()}
              className="w-full rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {accSaving ? "Adding…" : "Add Accomplishment"}
            </button>
          </form>
        </section>

        {/* Chronology (derived link to Timeline) */}
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
          <h3 className="font-serif text-base">Chronology</h3>
          <p className="mt-2 text-xs text-muted">
            {chronologyCount > 0
              ? `${chronologyCount} timeline event${chronologyCount === 1 ? "" : "s"} on file.`
              : "No timeline events yet."}{" "}
            The narrative draft above uses this loved one&rsquo;s Timeline.
          </p>
          <Link
            href={`/family/${familyId}/loved-ones/${lovedOneId}/timeline`}
            className="mt-3 inline-block text-xs font-semibold text-brand"
          >
            Go to Timeline →
          </Link>
        </section>

        {/* Collect support (derived link to Letters) */}
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
          <h3 className="font-serif text-base">Collect Support</h3>
          <p className="mt-2 text-xs text-muted">
            Write or request a &ldquo;Clemency support letter&rdquo; for this loved one from the Letters
            page.
          </p>
          <Link href={`/family/${familyId}/letters`} className="mt-3 inline-block text-xs font-semibold text-brand">
            Go to Letters →
          </Link>
        </section>

        {/* Family/community support (derived link to Support Network) */}
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
          <h3 className="font-serif text-base">Family &amp; Community Support</h3>
          <p className="mt-2 text-xs text-muted">
            Reflects who&rsquo;s listed in your Support Network and what they said they can help with.
          </p>
          <Link href={`/family/${familyId}/support`} className="mt-3 inline-block text-xs font-semibold text-brand">
            Go to Support Network →
          </Link>
        </section>
      </div>

      {/* Missing documentation */}
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-lg">Identify Missing Documentation</h2>
          <button
            onClick={handleCheckDocumentation}
            disabled={missingDocsStatus === "loading"}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {missingDocsStatus === "loading" ? "Checking…" : "Check Documentation"}
          </button>
        </div>
        {missingDocsStatus === "error" && (
          <p className="mt-3 text-sm text-brand" role="alert">
            Couldn&rsquo;t check documentation right now — please try again.
          </p>
        )}
        {missingDocs && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-sm">{missingDocs.summary}</p>
            {missingDocs.likelyMissing.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-muted">
                {missingDocs.likelyMissing.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Link href={`/family/${familyId}/documents`} className="mt-3 inline-block text-xs font-semibold text-brand">
          Go to Documents →
        </Link>
      </section>

      {/* Attorney questions */}
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-lg">Prepare Questions for an Attorney</h2>
          <button
            onClick={handleGenerateQuestions}
            disabled={questionsStatus === "loading"}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {questionsStatus === "loading" ? "Generating…" : questions ? "Regenerate Questions" : "Generate Questions"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Xonorate Family is not an attorney and does not give legal advice — this is a list of questions
          to bring to your own attorney, not answers.
        </p>
        {questionsStatus === "error" && (
          <p className="mt-3 text-sm text-brand" role="alert">
            Couldn&rsquo;t generate questions right now — please try again.
          </p>
        )}
        {questions && (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-sans text-sm">
            {questions}
          </pre>
        )}
      </section>
    </div>
  );
}
