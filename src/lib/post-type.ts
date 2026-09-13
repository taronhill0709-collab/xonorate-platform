// "daily_roundup"/"case_spotlight"/"policy" are the original types.
// The rest are Xonorate Intelligence's content classifications — see
// contentOpportunityEnum in src/db/schema.ts.
export const POST_TYPE_LABEL: Record<string, string> = {
  daily_roundup: "Roundup",
  case_spotlight: "Case spotlight",
  policy: "Policy",
  news_brief: "News brief",
  case_development: "Case development",
  analysis: "Xonorate analysis",
  explainer: "Explainer",
  watch: "Watch",
  resource: "Resource",
};

export const POST_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  published: "Published",
};

// Reader-facing labels for the public Xonorate Investigates section — same
// underlying `type` enum as POST_TYPE_LABEL above, worded for a visitor
// instead of an admin. daily_roundup no longer claims to be an
// "Investigation" — an aggregated roundup isn't original investigative
// work, and a real Investigation is now its own entity (src/db/schema.ts's
// `investigations` table) with its own public page.
export const PUBLIC_POST_TYPE_LABEL: Record<string, string> = {
  daily_roundup: "Roundup",
  case_spotlight: "Case spotlight",
  policy: "Policy",
  news_brief: "News brief",
  case_development: "Case development",
  analysis: "Analysis",
  explainer: "Explainer",
  watch: "Watch",
  resource: "Resource",
};

// Topic filters on the public Xonorate Investigates page. "investigations"
// is handled specially there (it queries the `investigations` table, not
// `posts`); "case_development" covers both the new case_development type
// and the legacy case_spotlight type, since both are case-tied updates.
// Older/rarer types (daily_roundup, policy, explainer, watch, resource)
// still show under "All"/"Latest" — they just don't get a dedicated tab.
export const NEWSROOM_TOPICS = [
  { value: "investigations", label: "Investigations" },
  { value: "analysis", label: "Analysis" },
  { value: "case_development", label: "Case developments" },
  { value: "news_brief", label: "News briefs" },
] as const;
