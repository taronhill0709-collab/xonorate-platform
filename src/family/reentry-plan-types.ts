// Client-safe: imports only from @/db/schema (no db/pg connection at module
// scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants out of
// DB-touching files" note. A "use client" board component imports this,
// never reentry-plan.ts directly.
import {
  reentryPlanCategoryEnum,
  reentryPlanCategoryStatusEnum,
} from "@/db/schema";

export type ReentryPlanCategory = (typeof reentryPlanCategoryEnum.enumValues)[number];
export type ReentryPlanCategoryStatus = (typeof reentryPlanCategoryStatusEnum.enumValues)[number];

// Display order for the board — spec section 19's list, kept in this order
// everywhere a category list is rendered rather than relying on enum
// declaration order (which is a DB implementation detail, not a UI choice).
export const REENTRY_PLAN_CATEGORIES: ReentryPlanCategory[] = [
  "identification",
  "housing",
  "employment",
  "transportation",
  "education",
  "healthcare",
  "benefits",
  "finances",
  "family",
  "community",
  "legal_obligations",
];

export const REENTRY_PLAN_CATEGORY_LABELS: Record<ReentryPlanCategory, string> = {
  identification: "Identification",
  housing: "Housing",
  employment: "Employment",
  transportation: "Transportation",
  education: "Education",
  healthcare: "Healthcare",
  benefits: "Benefits",
  finances: "Finances",
  family: "Family",
  community: "Community",
  legal_obligations: "Legal obligations",
};

export const REENTRY_PLAN_CATEGORY_STATUS_LABELS: Record<ReentryPlanCategoryStatus, string> = {
  not_started: "Not started",
  incomplete: "Incomplete",
  complete: "Complete",
};

export type ReentryPlanTimeframe = "plan30Day" | "plan60Day" | "plan90Day";

export const REENTRY_PLAN_TIMEFRAMES: { key: ReentryPlanTimeframe; label: string }[] = [
  { key: "plan30Day", label: "30-Day Plan" },
  { key: "plan60Day", label: "60-Day Plan" },
  { key: "plan90Day", label: "90-Day Plan" },
];

export type ReentryPlanCategoryRow = {
  category: ReentryPlanCategory;
  status: ReentryPlanCategoryStatus;
  plan30Day: string | null;
  plan60Day: string | null;
  plan90Day: string | null;
};

/**
 * The "you have identified housing and employment, but transportation has
 * not yet been planned" intelligence from spec section 19 — computed
 * directly from each category's own status, not inferred from free text,
 * since every plan always has one row per category (see
 * ensureReentryPlanForLovedOne in reentry-plan.ts). Kept here (not
 * reentry-plan.ts, which imports the db connection) so it's unit-testable
 * without a database — see dashboard.ts for the same pattern.
 */
export function summarizeReentryPlanGaps(
  categories: Pick<ReentryPlanCategoryRow, "category" | "status">[],
): {
  complete: ReentryPlanCategory[];
  incomplete: ReentryPlanCategory[];
  notStarted: ReentryPlanCategory[];
} {
  const complete: ReentryPlanCategory[] = [];
  const incomplete: ReentryPlanCategory[] = [];
  const notStarted: ReentryPlanCategory[] = [];

  for (const row of categories) {
    if (row.status === "complete") complete.push(row.category);
    else if (row.status === "incomplete") incomplete.push(row.category);
    else notStarted.push(row.category);
  }

  return { complete, incomplete, notStarted };
}
