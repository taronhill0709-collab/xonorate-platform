/** Internal acceptance-criteria checklist shown on the inquiry detail page.
 * Keys are stored as-is in inquiries.criteriaChecklist. */
export const INQUIRY_CRITERIA = [
  {
    key: "independentReview",
    label: "Independent/official review involvement (e.g. Conviction Review Unit)",
  },
  {
    key: "documentedIssue",
    label: "Documented evidentiary or procedural issue",
  },
  {
    key: "activeLegalAvenue",
    label: "Active legal avenue (pending appeal, petition, review board)",
  },
  {
    key: "sentenceTimeServed",
    label: "Sentence length / time served reviewed",
  },
] as const;

export type InquiryCriterionKey = (typeof INQUIRY_CRITERIA)[number]["key"];
