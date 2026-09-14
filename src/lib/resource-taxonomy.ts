// Labels and display metadata for the Resource Center's taxonomy. The
// underlying `category`/`resourceType` values are DB enums
// (src/db/schema.ts); `audiences` is a free string[] validated against
// RESOURCE_AUDIENCES below rather than a DB enum, matching how
// cases.contributingFactorTags/ISSUES work — see issues.ts.

export const RESOURCE_CATEGORY_LABEL: Record<string, string> = {
  knowledge: "Knowledge",
  legal: "Legal Resources",
  case_resource: "Case Resources",
  advocacy: "Advocacy Tools",
  research: "Research & Data",
  help_support: "Help & Support",
};

export const RESOURCE_CATEGORY_DEK: Record<string, string> = {
  knowledge: "Educational information about wrongful convictions.",
  legal: "Resources related to the legal process.",
  case_resource: "Practical resources for understanding and organizing a potential wrongful-conviction case.",
  advocacy: "Resources for taking action.",
  research: "Statistics, studies, and data on wrongful convictions.",
  help_support: "Resources organized by audience — families, exonerees, and anyone supporting them.",
};

// Order matches the brief's §5 category architecture.
export const RESOURCE_CATEGORIES = [
  "knowledge",
  "legal",
  "case_resource",
  "advocacy",
  "research",
  "help_support",
] as const;

export const RESOURCE_TYPE_LABEL: Record<string, string> = {
  guide: "Guide",
  tool: "Tool",
  organization: "Organization",
  legal_resource: "Legal Resource",
  research: "Research",
  report: "Report",
  data: "Data",
  court_resource: "Court Resource",
  educational: "Educational",
  advocacy: "Advocacy",
  directory: "Directory",
};

export const RESOURCE_TYPES = [
  "guide",
  "tool",
  "organization",
  "legal_resource",
  "research",
  "report",
  "data",
  "court_resource",
  "educational",
  "advocacy",
  "directory",
] as const;

// Audience tags a resource can be relevant to — a resource can carry several.
// Free-text array on the row (not an enum) so this list can grow without a
// migration; validated against this list at the admin form/action layer.
export const RESOURCE_AUDIENCES = [
  { tag: "families", label: "Families" },
  { tag: "incarcerated", label: "Incarcerated People" },
  { tag: "exonerees", label: "Exonerees" },
  { tag: "attorneys", label: "Attorneys" },
  { tag: "advocates", label: "Advocates" },
  { tag: "journalists", label: "Journalists" },
  { tag: "researchers", label: "Researchers" },
  { tag: "students", label: "Students" },
  { tag: "general_public", label: "General Public" },
] as const;

export function audienceLabel(tag: string): string {
  return RESOURCE_AUDIENCES.find((a) => a.tag === tag)?.label ?? tag;
}
