"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  resolveQuestionLabel,
  SUPPORT_LETTER_QUESTIONS,
  type SupportLetterPurpose,
} from "@/family/support-letters-types";
import {
  approveAction,
  deleteLetterAction,
  generateDraftAction,
  saveAnswersAction,
  saveEditsAction,
} from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "saving-answers" }
  | { kind: "generating" }
  | { kind: "saving-edits" }
  | { kind: "approving" }
  | { kind: "error"; message: string };

export function LetterWorkflow({
  familyId,
  letterId,
  purpose,
  lovedOneName,
  answers,
  content,
  status: letterStatus,
}: {
  familyId: string;
  letterId: string;
  purpose: SupportLetterPurpose;
  lovedOneName: string;
  answers: Record<string, string>;
  content: string | null;
  status: "draft" | "generated" | "approved";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [editableContent, setEditableContent] = useState(content ?? "");
  const questions = SUPPORT_LETTER_QUESTIONS[purpose];

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (content) {
      const proceed = confirm(
        "This will replace your current draft, including any edits you've made. Continue?",
      );
      if (!proceed) return;
    }

    setStatus({ kind: "saving-answers" });
    const formData = new FormData(e.currentTarget);
    const saved = await saveAnswersAction(familyId, letterId, formData);
    if (!saved.success) {
      setStatus({ kind: "error", message: "Couldn't save your answers. Please try again." });
      return;
    }

    setStatus({ kind: "generating" });
    const result = await generateDraftAction(familyId, letterId);
    if (result.success) {
      router.refresh();
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleSaveEdits() {
    setStatus({ kind: "saving-edits" });
    const result = await saveEditsAction(familyId, letterId, editableContent);
    setStatus(result.success ? { kind: "idle" } : { kind: "error", message: "Couldn't save your edits." });
    router.refresh();
  }

  async function handleApprove() {
    setStatus({ kind: "approving" });
    if (editableContent !== content) {
      await saveEditsAction(familyId, letterId, editableContent);
    }
    await approveAction(familyId, letterId);
    setStatus({ kind: "idle" });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this letter? This cannot be undone.")) return;
    await deleteLetterAction(familyId, letterId);
    router.push(`/family/${familyId}/letters`);
  }

  function handleDownload() {
    const blob = new Blob([editableContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `letter-for-${lovedOneName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">Answer a few questions</h2>
        <p className="mt-1 text-sm text-muted">
          Answer in your own words — only what you write here is used to draft the letter.
        </p>
        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          {questions.map((q) => (
            <div key={q.key}>
              <label htmlFor={q.key} className="block text-sm font-medium">
                {resolveQuestionLabel(q.label, lovedOneName)}
              </label>
              <textarea
                id={q.key}
                name={q.key}
                rows={2}
                defaultValue={answers[q.key] ?? ""}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          ))}
          {status.kind === "error" && (
            <p className="text-sm text-brand" role="alert">
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={status.kind === "saving-answers" || status.kind === "generating"}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {status.kind === "generating"
              ? "Drafting your letter…"
              : content
                ? "Save Answers & Regenerate Draft"
                : "Save Answers & Draft Letter"}
          </button>
        </form>
      </section>

      {content && (
        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Your letter</h2>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
              {letterStatus === "approved" ? "Approved" : "Draft — review before using"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Drafted with AI assistance based on your answers. Read it over, personalize it, and make
            sure everything is accurate before sending it anywhere.
          </p>
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            rows={16}
            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed focus:border-brand focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveEdits}
                disabled={status.kind === "saving-edits"}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand disabled:opacity-60"
              >
                {status.kind === "saving-edits" ? "Saving…" : "Save Edits"}
              </button>
              <button
                onClick={handleApprove}
                disabled={status.kind === "approving"}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {letterStatus === "approved" ? "Approved ✓" : "Approve Letter"}
              </button>
              <button
                onClick={handleDownload}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
              >
                Download as Text
              </button>
            </div>
            <button onClick={handleDelete} className="text-sm text-muted transition hover:text-brand">
              Delete Letter
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
