"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORT_LETTER_PURPOSE_LABELS, type SupportLetterPurpose } from "@/family/support-letters-types";
import { createSupportLetterAction } from "./actions";

export function CreateLetterForm({
  familyId,
  lovedOnes,
  defaultLovedOneId,
}: {
  familyId: string;
  lovedOnes: { id: string; name: string }[];
  defaultLovedOneId?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await createSupportLetterAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/letters/${result.letterId}`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="lovedOneId" className="block text-sm font-medium">
          Who is this letter supporting?
        </label>
        <select
          id="lovedOneId"
          name="lovedOneId"
          required
          defaultValue={defaultLovedOneId ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          <option value="" disabled>
            Choose a loved one
          </option>
          {lovedOnes.map((lo) => (
            <option key={lo.id} value={lo.id}>
              {lo.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="purpose" className="block text-sm font-medium">
          Letter type
        </label>
        <select
          id="purpose"
          name="purpose"
          defaultValue=""
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          <option value="" disabled>
            Choose a type
          </option>
          {(Object.entries(SUPPORT_LETTER_PURPOSE_LABELS) as [SupportLetterPurpose, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label htmlFor="recipientName" className="block text-sm font-medium">
          Recipient <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="recipientName"
          name="recipientName"
          placeholder="e.g. Parole Board, Jane Smith - Hiring Manager"
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
        {status.kind === "loading" ? "Starting…" : "Start This Letter"}
      </button>
    </form>
  );
}
