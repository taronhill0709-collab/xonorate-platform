"use client";

import { useRef, useState, useTransition } from "react";
import { extractCaseOverviewAction } from "./actions";

/** Fills the manual New Case form (rendered by the server component this
 * mounts inside) from an extracted draft. Those inputs are plain
 * uncontrolled elements with defaultValue, so setting .value directly here
 * is safe -- no React state is fighting for control of them, and it avoids
 * rebuilding the whole form as a controlled component just for this. */
function fillForm(fields: Record<string, string>) {
  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null;
    if (el) el.value = value;
  }
}

export function ImportOverviewForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  return (
    <div className="mb-8 rounded-lg border border-border p-4">
      <h2 className="font-serif text-lg text-foreground">Import from attorney overview</h2>
      <p className="mt-1 text-sm text-muted">
        Upload the attorney&apos;s case overview PDF and the fields below will be drafted for you
        to review before saving. No overview yet — say you&apos;re working directly with the
        family instead? Just fill in the fields manually below.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          disabled={isPending}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-foreground file:transition hover:file:opacity-90"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            const file = fileRef.current?.files?.[0];
            if (!file) {
              setMessage({ tone: "error", text: "Choose a PDF first." });
              return;
            }
            setMessage(null);
            startTransition(async () => {
              const formData = new FormData();
              formData.set("overview", file);
              const result = await extractCaseOverviewAction(formData);
              if (!result.ok) {
                setMessage({ tone: "error", text: result.error });
                return;
              }
              const { hasExoneration, ...fields } = result.data;
              fillForm(fields);
              const statusEl = document.getElementById("status") as HTMLSelectElement | null;
              if (statusEl && hasExoneration) statusEl.value = "exonerated";
              setMessage({
                tone: "ok",
                text: "Drafted from the document — review every field below before saving.",
              });
            });
          }}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Reading document…" : "Generate case from document"}
        </button>
      </div>
      {message && (
        <p className={message.tone === "ok" ? "mt-3 text-sm text-brand" : "mt-3 text-sm text-red-400"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
