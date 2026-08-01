"use client";

import { useState, useTransition } from "react";
import { refreshSocialMetrics } from "./actions";

export function RefreshMetricsButton() {
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
            const result = await refreshSocialMetrics();
            if (result.ok) {
              setMessage(
                result.failed > 0
                  ? `Refreshed ${result.refreshed}, ${result.failed} failed.`
                  : `Refreshed ${result.refreshed} post${result.refreshed === 1 ? "" : "s"}.`,
              );
            } else {
              setMessage(result.error);
            }
          });
        }}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted-background disabled:opacity-60"
      >
        {isPending ? "Refreshing…" : "Refresh social metrics"}
      </button>
      {message && <p className="mt-1.5 text-xs text-muted">{message}</p>}
    </div>
  );
}
