"use client";

import { useTransition } from "react";
import { moveCase } from "./actions";

export function CaseReorderButtons({
  caseId,
  isFirst,
  isLast,
}: {
  caseId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="Move up"
        disabled={isPending || isFirst}
        onClick={() => startTransition(() => moveCase(caseId, "up"))}
        className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={isPending || isLast}
        onClick={() => startTransition(() => moveCase(caseId, "down"))}
        className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
