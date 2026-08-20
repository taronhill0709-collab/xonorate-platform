export const CASE_STATUS_LABEL: Record<string, string> = {
  active_case: "Active case",
  exonerated: "Exonerated",
  awaiting_review: "Awaiting review",
};

// Shown on cases where isClient is false — a case we're spotlighting for
// public awareness rather than one we represent.
export const SPOTLIGHT_CASE_LABEL = "Spotlight case — not a Xonorate client";
