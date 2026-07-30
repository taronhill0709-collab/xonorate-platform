"use client";

import { useTransition } from "react";
import { updateCaseStatus } from "./actions";
import { CASE_STATUS_LABEL } from "@/lib/case-status";

const STATUS_OPTIONS = ["active_case", "awaiting_review", "exonerated"] as const;

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
      className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60"
    >
      {STATUS_OPTIONS.map((value) => (
        <option key={value} value={value}>
          {CASE_STATUS_LABEL[value]}
        </option>
      ))}
    </select>
  );
}
