// The National Registry of Exonerations' standard contributing-factor
// categories (exonerationregistry.org) — used to tag a case's structured
// `contributingFactorTags`, separate from convictionDetails.contributingFactors
// (free-text narrative). Kept as plain strings rather than a DB enum so a
// case can carry a factor NRE adds later without a migration.
export const CONTRIBUTING_FACTOR_TAGS = [
  "Mistaken witness identification",
  "False confession",
  "Perjury or false accusation",
  "False or misleading forensic evidence",
  "Official misconduct",
  "Inadequate legal defense",
] as const;
