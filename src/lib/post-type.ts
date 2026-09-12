export const POST_TYPE_LABEL: Record<string, string> = {
  daily_roundup: "Roundup",
  case_spotlight: "Case spotlight",
  policy: "Policy",
};

export const POST_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  published: "Published",
};

// Reader-facing labels for the public Newsroom — same underlying `type`
// enum as POST_TYPE_LABEL above, worded for a visitor instead of an admin.
export const PUBLIC_POST_TYPE_LABEL: Record<string, string> = {
  daily_roundup: "Investigation",
  case_spotlight: "Case spotlight",
  policy: "Policy",
};

export const NEWSROOM_TOPICS = [
  { value: "daily_roundup", label: "Investigations" },
  { value: "case_spotlight", label: "Case spotlights" },
  { value: "policy", label: "Policy" },
] as const;
