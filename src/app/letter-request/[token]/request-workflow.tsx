"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  resolveQuestionLabel,
  SUPPORT_LETTER_QUESTIONS,
  type SupportLetterPurpose,
} from "@/family/support-letters-types";
import { approveAction, generateDraftAction, saveAnswersAction, saveEditsAction } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "saving-answers" }
  | { kind: "generating" }
  | { kind: "saving-edits" }
  | { kind: "approving" }
  | { kind: "approved" }
  | { kind: "error"; message: string };

export function RequestWorkflow({
  token,
  purpose,
  lovedOneName,
  answers,
  content,
  alreadyApproved,
}: {
  token: string;
  purpose: SupportLetterPurpose;
  lovedOneName: string;
  answers: Record<string, string>;
  content: string | null;
  alreadyApproved: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(alreadyApproved ? { kind: "approved" } : { kind: "idle" });
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
    const saved = await saveAnswersAction(token, formData);
    if (!saved.success) {
      setStatus({ kind: "error", message: "Couldn't save your answers. Please try again." });
      return;
    }

    setStatus({ kind: "generating" });
    const result = await generateDraftAction(token);
    if (result.success) {
      router.refresh();
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleSaveEdits() {
    setStatus({ kind: "saving-edits" });
    const result = await saveEditsAction(token, editableContent);
    setStatus(result.success ? { kind: "idle" } : { kind: "error", message: "Couldn't save your edits." });
    router.refresh();
  }

  async function handleApprove() {
    setStatus({ kind: "approving" });
    if (editableContent !== content) {
      await saveEditsAction(token, editableContent);
    }
    await approveAction(token);
    setStatus({ kind: "approved" });
    router.refresh();
  }

  if (status.kind === "approved") {
    return (
      <div className="rounded-2xl border border-border bg-muted-background p-8 text-center">
        <h2 className="font-serif text-lg text-accent">Thank you</h2>
        <p className="mt-2 text-sm text-muted">
          Your letter has been approved and shared with {lovedOneName}&rsquo;s family. They&rsquo;ll
          take it from here.
        </p>
      </div>
    );
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
          <h2 className="font-serif text-lg">Your letter</h2>
          <p className="mt-2 text-xs text-muted">
            Drafted with AI assistance based on your answers. Read it over, personalize it, and
            make sure everything is accurate — this is being sent in your name.
          </p>
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            rows={16}
            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed focus:border-brand focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap gap-3">
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
              {status.kind === "approving" ? "Approving…" : "Approve & Share With Family"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
