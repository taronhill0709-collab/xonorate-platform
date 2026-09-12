import { slugify } from "@/lib/slug";

export type IssueDefinition = {
  /** Matches a value in CONTRIBUTING_FACTOR_TAGS — the source of truth for
   * which cases relate to this issue. */
  tag: string;
  slug: string;
  title: string;
  dek: string;
  explanation: string;
  /** Only set where a cited national figure actually exists — see
   * national-exoneration-stats.ts for sourcing. Left out rather than
   * guessed for issues with no sourced percentage. */
  stat?: { value: string; label: string };
};

const SOURCE_URL = "https://innocenceproject.org/exonerations-data/";

/** The Issues — one page per real contributing-factor tag used on
 * Xonorate's own cases (see contributing-factors.ts), not a separate
 * invented taxonomy. The Xonorate 2.0 brief's suggested list (False
 * Confessions, Eyewitness Misidentification, Jailhouse Informants,
 * Prosecutorial Misconduct, Police Misconduct, Forensic Error, Ineffective
 * Counsel, Suppressed Evidence) maps onto these seven tags with one
 * deliberate difference: Xonorate's tagging doesn't separate prosecutorial
 * misconduct, police misconduct, and suppressed evidence into distinct
 * categories — they're all "Official misconduct" here, which is also how
 * the National Registry of Exonerations itself codes it. Splitting that
 * into three pages would imply a distinction the data doesn't draw. */
export const ISSUES: IssueDefinition[] = [
  {
    tag: "Mistaken witness identification",
    slug: slugify("Mistaken witness identification"),
    title: "Eyewitness misidentification",
    dek: "Confident, and wrong.",
    explanation:
      "An eyewitness points to the wrong person — not out of dishonesty, but because human memory is reconstructive, not a recording. Stress, cross-racial identification, weapon focus, and suggestive police procedures (a lineup where one person stands out) can all distort a memory before a witness ever takes the stand. It is the single most common factor in convictions later overturned by DNA evidence.",
    stat: { value: "62%", label: "of Innocence Project client cases" },
  },
  {
    tag: "False confession",
    slug: slugify("False confession"),
    title: "False confessions",
    dek: "Admitting to a crime you didn't commit.",
    explanation:
      "People confess to crimes they didn't commit more often than most people assume — after hours of high-pressure interrogation, when they're young, mentally ill, intellectually disabled, or simply told, falsely, that confessing is the only way to go home. Once a confession exists, it is extraordinarily persuasive to a jury, even when every other piece of evidence points away from the person who gave it.",
    stat: { value: "29%", label: "of Innocence Project client cases" },
  },
  {
    tag: "Jailhouse informants",
    slug: slugify("Jailhouse informants"),
    title: "Jailhouse informants",
    dek: "Testimony traded for a deal.",
    explanation:
      "An incarcerated person testifies that the defendant confessed to them in a cell or holding area — testimony frequently traded for a reduced sentence, dropped charges, or another benefit the jury is never told about. Because informant testimony is difficult to independently verify, it has proven to be one of the least reliable, and most reversible, forms of evidence used to convict.",
    stat: { value: "19%", label: "of Innocence Project client cases" },
  },
  {
    tag: "False or misleading forensic evidence",
    slug: slugify("False or misleading forensic evidence"),
    title: "Forensic error",
    dek: "The lab coat isn't proof.",
    explanation:
      "Forensic disciplines that sound scientific — bite-mark analysis, hair microscopy, arson pattern reading, even some fingerprint and ballistics comparisons — have been used in court for decades without the rigorous validation the word “science” implies. When these methods are later re-examined, false matches and inflated certainty have sent people to prison for crimes the evidence never actually proved.",
    stat: { value: "52%", label: "of Innocence Project client cases" },
  },
  {
    tag: "Official misconduct",
    slug: slugify("Official misconduct"),
    title: "Official misconduct",
    dek: "Prosecutorial and police misconduct, including suppressed evidence.",
    explanation:
      "Prosecutors and police are required to turn over evidence that could help a defendant, and required not to coach witnesses, hide deals, or build a case around evidence they know is unreliable. When they don't, the resulting conviction rests on a version of events the jury was never allowed to fully see. This covers what are sometimes discussed separately as prosecutorial misconduct, police misconduct, and suppressed (Brady) evidence — Xonorate tags all three under this one category, matching how the National Registry of Exonerations itself codes it.",
  },
  {
    tag: "Inadequate legal defense",
    slug: slugify("Inadequate legal defense"),
    title: "Ineffective counsel",
    dek: "A defense in name only.",
    explanation:
      "Every defendant has a right to counsel — but a right to counsel is not the same as a right to a competent defense. An overworked public defender carrying hundreds of open cases, or a private attorney who never investigates an alibi, interviews a witness, or challenges weak forensic evidence, can leave a genuinely innocent client with no real defense at trial at all.",
  },
  {
    tag: "Perjury or false accusation",
    slug: slugify("Perjury or false accusation"),
    title: "Perjury or false accusation",
    dek: "A knowing lie under oath.",
    explanation:
      "Sometimes a wrongful conviction starts with someone simply lying under oath — a witness settling a grudge, protecting the real perpetrator, or accusing an innocent person under pressure from police. Unlike a mistaken identification, this is a knowing falsehood, and it can be just as difficult to unwind once it becomes part of the trial record.",
  },
];

export const ISSUES_SOURCE_URL = SOURCE_URL;

export function getIssueBySlug(slug: string): IssueDefinition | undefined {
  return ISSUES.find((issue) => issue.slug === slug);
}
