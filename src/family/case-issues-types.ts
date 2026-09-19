// Client-safe: imports only from @/db/schema (no db/pg connection at
// module scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants
// out of DB-touching files" note.
import { familyCaseIssueStatusEnum, familyCaseIssuePriorityEnum } from "@/db/schema";

export type CaseIssueStatus = (typeof familyCaseIssueStatusEnum.enumValues)[number];
export type CaseIssuePriority = (typeof familyCaseIssuePriorityEnum.enumValues)[number];

export const CASE_ISSUE_STATUS_LABELS: Record<CaseIssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
};

export const CASE_ISSUE_PRIORITY_LABELS: Record<CaseIssuePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
