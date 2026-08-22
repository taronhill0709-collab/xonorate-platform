"use client";

import { useTransition } from "react";
import { updateCaseStatus } from "./actions";
import { CASE_STATUS_LABEL } from "@/lib/case-status";

const STATUS_OPTIONS = ["active_case", "awaiting_review", "exonerated"] as const;

// Semantic status color, matching the admin design's exhibit-tag language —
// kept separate from the brand gold so "state of this case" never reads as
// a decorative accent.
const STATUS_STYLE: Record<string, string> = {
  active_case: "border-[#6b5326] bg-[rgba(201,154,68,0.12)] text-[#d9ac57]",
  exonerated: "border-[#4c6b39] bg-[rgba(120,166,90,0.14)] text-[#9fc27a]",
  awaiting_review: "border-border bg-background text-muted",
};

export function CaseStatusSelect({
  caseId,
  status,
}: {
  caseId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          updateCaseStatus(caseId, next as (typeof STATUS_OPTIONS)[number]);
        });
      }}
      className={`rounded-md border px-2 py-1 font-mono text-xs tracking-wide uppercase disabled:opacity-60 ${STATUS_STYLE[status] ?? STATUS_STYLE.awaiting_review}`}
    >
      {STATUS_OPTIONS.map((value) => (
        <option key={value} value={value} className="bg-background text-foreground normal-case">
          {CASE_STATUS_LABEL[value]}
        </option>
      ))}
    </select>
  );
}
