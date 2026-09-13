// Xonorate's real editorial production workflow for an original
// investigation — see investigationStatusEnum in src/db/schema.ts.
export const INVESTIGATION_STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  researching: "Researching",
  in_reporting: "In reporting",
  editorial_review: "Editorial review",
  ready_to_publish: "Ready to publish",
  published: "Published",
  updated: "Updated",
};

export const INVESTIGATION_STATUS_TONE: Record<string, "brand" | "neutral" | "danger"> = {
  idea: "neutral",
  researching: "neutral",
  in_reporting: "brand",
  editorial_review: "brand",
  ready_to_publish: "danger",
  published: "danger",
  updated: "danger",
};

export const INVESTIGATION_MATERIAL_KIND_LABEL: Record<string, string> = {
  document: "Document",
  interview: "Interview",
  data: "Data",
};
