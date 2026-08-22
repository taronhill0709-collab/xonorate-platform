"use client";

import { useState, useTransition } from "react";
import { triggerCaseCandidateResearch } from "../actions";

export function TriggerResearchButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await triggerCaseCandidateResearch();
            setMessage(
              result.ok
                ? "Research started — this can take up to a minute. Refresh the page to check for a new candidate."
                : result.error,
            );
          });
        }}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Starting…" : "Research a candidate now"}
      </button>
      {message && <p className="mt-1.5 text-xs text-muted">{message}</p>}
    </div>
  );
}
