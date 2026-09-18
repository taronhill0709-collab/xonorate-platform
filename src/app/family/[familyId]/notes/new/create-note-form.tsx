"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NOTE_VISIBILITY_LABELS, type NoteVisibility } from "@/family/notes-types";
import { createNoteAction } from "./actions";

export function CreateNoteForm({
  familyId,
  lovedOnes,
}: {
  familyId: string;
  lovedOnes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await createNoteAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/notes`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Note
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={5}
          placeholder="e.g. Attorney called today — case update expected next week."
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium">
          Who can see this
        </label>
        <select
          id="visibility"
          name="visibility"
          defaultValue="family"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(NOTE_VISIBILITY_LABELS) as [NoteVisibility, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {lovedOnes.length > 0 && (
        <div>
          <label htmlFor="lovedOneId" className="block text-sm font-medium">
            About <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="lovedOneId"
            name="lovedOneId"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Not specific to one loved one</option>
            {lovedOnes.map((lo) => (
              <option key={lo.id} value={lo.id}>
                {lo.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {status.kind === "loading" ? "Saving…" : "Add Note"}
      </button>
    </form>
  );
}
