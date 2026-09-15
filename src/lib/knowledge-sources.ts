// Labels and display metadata for the knowledge graph's source library
// (src/db/schema.ts: knowledgeSources). Mirrors resource-taxonomy.ts's
// convention of keeping enum labels/ordering here, separate from the schema.

export const KNOWLEDGE_SOURCE_KIND_LABEL: Record<string, string> = {
  statute: "Statute",
  case_law: "Case Law",
  court_rule: "Court Rule",
  constitutional_provision: "Constitutional Provision",
  government_publication: "Government Publication",
  agency_guidance: "Agency Guidance",
  academic_research: "Academic / Peer-Reviewed Research",
  innocence_organization: "Innocence / Advocacy Organization",
  other_authoritative: "Other Authoritative Source",
};

export const KNOWLEDGE_SOURCE_KINDS = [
  "statute",
  "case_law",
  "court_rule",
  "constitutional_provision",
  "government_publication",
  "agency_guidance",
  "academic_research",
  "innocence_organization",
  "other_authoritative",
] as const;

// Mirrors the source verification standard's 5-tier hierarchy exactly:
// 1 = primary authority (courts/statutes/constitution/official rules),
// 2 = official/government (agencies, official guidance, gov commissions),
// 3 = academic/peer-reviewed research, 4 = established organizations (NRE,
// Innocence Project, Innocence Network — research/education/statistics,
// never a substitute for controlling law), 5 = Xonorate's own material.
// Ask Xonorate prefers lower (higher-authority) tiers when answering "what
// does the law say" questions, and never treats tier 4/5 as legal authority.
export const AUTHORITY_TIER_LABEL: Record<number, string> = {
  1: "Tier 1 — Primary Authority",
  2: "Tier 2 — Official / Government",
  3: "Tier 3 — Academic / Research",
  4: "Tier 4 — Established Organizations",
  5: "Tier 5 — Xonorate Material",
};

export const AUTHORITY_TIERS = [1, 2, 3, 4, 5] as const;

// DRAFT -> UNDER REVIEW -> VERIFIED -> APPROVED -> OUTDATED. Both "verified"
// and "approved" are retrievable by Ask Xonorate (see retrieveContext in
// ask-xonorate.ts) — "verified" means every fact-check in the source
// verification standard has passed; "approved" additionally means an
// editor has signed off on it going live. "draft"/"under_review" never
// reach a public answer.
export const KNOWLEDGE_SOURCE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft (not yet retrievable)",
  under_review: "Under review (not yet retrievable)",
  verified: "Verified (retrievable)",
  approved: "Approved (retrievable)",
  outdated: "Outdated (kept for the record, excluded from retrieval)",
};

export const KNOWLEDGE_SOURCE_STATUSES = ["draft", "under_review", "verified", "approved", "outdated"] as const;

// Knowledge-source topic tags beyond the 7 causal ISSUES tags (which cover
// "what contributes to a wrongful conviction," not procedural/legal-research
// subjects). knowledgeSourceIssueLinks.issueTag is free text, not FK'd to
// the ISSUES table, so a knowledge source can carry one of these instead —
// matchIssueTags() in ask-xonorate.ts recognizes both vocabularies when
// retrieving for a question. Xonorate resources/cases keep using ISSUES
// only; this list is knowledgeSources-specific.
export const KNOWLEDGE_TOPICS = [
  { tag: "Post-conviction relief", keywords: ["post-conviction", "postconviction", "habeas", "motion for new trial", "appeal"] },
  { tag: "Actual innocence", keywords: ["actual innocence", "innocence claim", "innocence procedure"] },
  { tag: "Newly discovered evidence", keywords: ["newly discovered evidence", "newly available evidence", "new evidence"] },
  { tag: "Wrongful conviction research", keywords: ["wrongful conviction", "exoneration data", "contributing factors", "causes of wrongful"] },
  { tag: "DNA testing", keywords: ["dna testing", "post-conviction dna", "dna evidence"] },
  { tag: "Compensation", keywords: ["compensation", "wrongful conviction compensation"] },
  { tag: "Reentry and record relief", keywords: ["reentry", "expungement", "record relief", "record sealing"] },
] as const;
