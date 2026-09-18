"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/family/documents-types";
import { uploadDocumentAction } from "./actions";

export function UploadDocumentForm({
  familyId,
  lovedOnes,
  defaultLovedOneId,
}: {
  familyId: string;
  lovedOnes: { id: string; name: string }[];
  defaultLovedOneId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await uploadDocumentAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/documents`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="file" className="block text-sm font-medium">
          File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            // Suggest a title from the filename, but only if the user
            // hasn't already typed one — never clobber their own edit.
            if (title) return;
            const name = e.target.files?.[0]?.name;
            if (name) setTitle(name.replace(/\.[^./]+$/, ""));
          }}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand focus:border-brand focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted">PDF, Word, text, or image. Up to 15MB.</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sentencing order"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue="other"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(
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
            defaultValue={defaultLovedOneId ?? ""}
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

      <div>
        <label htmlFor="tags" className="block text-sm font-medium">
          Tags <span className="font-normal text-muted">(optional, comma-separated)</span>
        </label>
        <input
          id="tags"
          name="tags"
          placeholder="e.g. appeal, 2019"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

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
        {status.kind === "loading" ? "Uploading…" : "Add Document"}
      </button>
      <p className="text-center text-xs text-muted">
        Private to your family. Only people you invite can access this document.
      </p>
    </form>
  );
}
