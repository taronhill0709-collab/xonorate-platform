"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentDraftInput } from "@/lib/content-draft";
import { getContentDraftStatus, startContentDraft } from "./actions";

const POLL_INTERVAL_MS = 2500;
// Background function has a 15-minute budget, but if it dies without ever
// writing a status (a hard Netlify kill, not a caught error), polling would
// otherwise continue forever with no way out but reloading the page. Give up
// well short of that and let the editor retry instead.
const MAX_POLL_ATTEMPTS = 120; // 120 * 2.5s = 5 minutes

/** Reads the manual-source fields from SourceMaterialSection's "Add a
 * source of your own" fieldset directly off the DOM — the same
 * uncontrolled-input technique this component already uses for #type/#body.
 * Needed because a manual source isn't saved (and so has no id to build a
 * ContentDraftInput from) until the surrounding form is actually submitted;
 * this lets drafting work off whatever's currently typed in, unsaved. */
function readManualSourceInput(): Omit<ContentDraftInput, "type"> | null {
  const sourceUrl = (document.getElementById("manualSourceUrl") as HTMLInputElement | null)?.value.trim();
  if (!sourceUrl) return null;

  const headline = (document.getElementById("manualSourceHeadline") as HTMLInputElement | null)?.value.trim() || sourceUrl;
  const sourcePublication =
    (document.getElementById("manualSourcePublication") as HTMLInputElement | null)?.value.trim() || "Unknown source";
  const summary = (document.getElementById("manualSourceSummary") as HTMLTextAreaElement | null)?.value.trim() || headline;

  return { headline, sourcePublication, sourceUrl, summary, whyThisMatters: null, issueTags: [], caseName: null };
}

/** Drafts (or re-drafts) a post's body from its source via Claude,
 * asynchronously — see startContentDraft for why this can't just be a
 * plain Server Action. Reads the current "Content type" select at click
 * time (not a fixed prop) so switching type before clicking uses the type
 * actually selected, then fills the #body textarea directly once the
 * background job finishes — the same uncontrolled-input technique
 * import-overview-form.tsx uses, since these fields have no React state of
 * their own to update. Never saves anything itself; the editor still has
 * to click Save/Create to persist it.
 *
 * `baseInput` is the source known server-side (from "Create With This", or
 * an already-attached source on an existing post) — when there isn't one,
 * this falls back to whatever's currently typed into the "Add a source of
 * your own" fields, so drafting works before that source is ever saved. */
export function DraftBodyButton({ baseInput }: { baseInput: Omit<ContentDraftInput, "type"> | null }) {
  const cancelledRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "pending"; text: string } | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function handleClick() {
    const input = baseInput ?? readManualSourceInput();
    if (!input) {
      setMessage({ tone: "error", text: "Add a source above first — either from Xonorate Intelligence or your own." });
      return;
    }

    const typeEl = document.getElementById("type") as HTMLSelectElement | null;
    const type = typeEl?.value ?? "news_brief";
    const isDeepType = type === "analysis" || type === "explainer";

    setIsBusy(true);
    setMessage({
      tone: "pending",
      text: isDeepType
        ? "Researching and drafting — this can take up to a minute…"
        : "Drafting…",
    });

    const started = await startContentDraft({ ...input, type });
    if (cancelledRef.current) return;
    if (!started.ok) {
      setMessage({ tone: "error", text: started.error });
      setIsBusy(false);
      return;
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (cancelledRef.current) return;

      const result = await getContentDraftStatus(started.jobId);
      if (cancelledRef.current) return;
      if (result.status === "pending") continue;

      if (result.status === "failed") {
        setMessage({ tone: "error", text: result.error });
        setIsBusy(false);
        return;
      }

      const bodyEl = document.getElementById("body") as HTMLTextAreaElement | null;
      if (bodyEl) bodyEl.value = result.body;

      // Only for a source the editor typed in themselves — an
      // Intelligence-sourced post already has its headline prefilled
      // server-side before this button is ever clicked, so this never
      // overwrites a headline the editor already wrote or edited.
      const titleEl = document.getElementById("title") as HTMLInputElement | null;
      if (titleEl && !titleEl.value.trim()) titleEl.value = input.headline;

      setMessage({ tone: "ok", text: "Drafted — verify every fact and rewrite freely before saving." });
      setIsBusy(false);
      return;
    }

    setMessage({
      tone: "error",
      text: "This is taking longer than expected. It may still finish in the background — try again in a minute, or write the body yourself.",
    });
    setIsBusy(false);
  }

  return (
    <div>
      <button
        type="button"
        disabled={isBusy}
        onClick={handleClick}
        className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-light disabled:opacity-60"
      >
        {isBusy ? "Drafting…" : "Generate AI draft from source →"}
      </button>
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "mt-2 text-sm text-brand"
              : message.tone === "error"
                ? "mt-2 text-sm text-red-400"
                : "mt-2 text-sm text-muted"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
