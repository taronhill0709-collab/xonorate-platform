"use client";

import { useEffect, useRef, useState } from "react";
import { getCaseOverviewExtractionStatus, startCaseOverviewExtraction } from "./actions";

const POLL_INTERVAL_MS = 2500;

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
  const cancelledRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "pending"; text: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function handleGenerate() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage({ tone: "error", text: "Choose a PDF first." });
      return;
    }

    setIsBusy(true);
    setMessage({ tone: "pending", text: "Uploading document…" });

    const formData = new FormData();
    formData.set("overview", file);
    const started = await startCaseOverviewExtraction(formData);
    if (cancelledRef.current) return;
    if (!started.ok) {
      setMessage({ tone: "error", text: started.error });
      setIsBusy(false);
      return;
    }

    setMessage({
      tone: "pending",
      text: "Reading document and drafting the case — this can take up to a minute…",
    });

    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (cancelledRef.current) return;

      const result = await getCaseOverviewExtractionStatus(started.jobId);
      if (cancelledRef.current) return;
      if (result.status === "pending") continue;

      if (result.status === "failed") {
        setMessage({ tone: "error", text: result.error });
        setIsBusy(false);
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
      setIsBusy(false);
      return;
    }
  }

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
          disabled={isBusy}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-foreground file:transition hover:file:opacity-90"
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={handleGenerate}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isBusy ? "Working…" : "Generate case from document"}
        </button>
      </div>
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "mt-3 text-sm text-brand"
              : message.tone === "error"
                ? "mt-3 text-sm text-red-400"
                : "mt-3 text-sm text-muted"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
