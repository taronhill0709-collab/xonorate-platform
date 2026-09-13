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

/** Drafts (or re-drafts) a post's body from its source via Claude,
 * asynchronously — see startContentDraft for why this can't just be a
 * plain Server Action. Reads the current "Content type" select at click
 * time (not a fixed prop) so switching type before clicking uses the type
 * actually selected, then fills the #body textarea directly once the
 * background job finishes — the same uncontrolled-input technique
 * import-overview-form.tsx uses, since these fields have no React state of
 * their own to update. Never saves anything itself; the editor still has
 * to click Save/Create to persist it. */
export function DraftBodyButton({ input }: { input: Omit<ContentDraftInput, "type"> }) {
  const cancelledRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "pending"; text: string } | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function handleClick() {
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
