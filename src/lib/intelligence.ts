// Display labels/tones for Xonorate Intelligence's editorial fields — shared
// across the dashboard, Source Library, and the post editor so the three
// surfaces describe the same item consistently.

export const EDITORIAL_SIGNAL_LABEL: Record<string, string> = {
  high_priority: "High priority",
  important: "Important",
  routine: "Routine",
  duplicate: "Duplicate",
  low_relevance: "Low relevance",
};

export const EDITORIAL_SIGNAL_TONE: Record<string, "brand" | "neutral" | "danger"> = {
  high_priority: "danger",
  important: "brand",
  routine: "neutral",
  duplicate: "neutral",
  low_relevance: "neutral",
};

// Matches contentOpportunityEnum — the classification an editor picks (or
// the AI suggests) when deciding what a discovered source becomes.
export const CONTENT_OPPORTUNITY_LABEL: Record<string, string> = {
  news_brief: "News brief",
  case_development: "Case development",
  analysis: "Xonorate analysis",
  investigation: "Investigation",
  explainer: "Explainer",
  watch: "Watch",
  resource: "Resource",
};

export const INTELLIGENCE_STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  used: "Used",
  rejected: "Rejected",
};

// The five lightweight content types a post can be created as directly from
// "Create With This" — "investigation" is handled separately (flagForInvestigation)
// since there's no Investigation Builder/table yet.
export const CREATE_WITH_THIS_POST_TYPES = [
  "news_brief",
  "case_development",
  "analysis",
  "explainer",
  "watch",
  "resource",
] as const;
