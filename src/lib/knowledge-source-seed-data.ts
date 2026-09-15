/**
 * The Xonorate Foundational Knowledge Library — the first verified batch of
 * knowledgeSources rows, researched via live web verification (real
 * citations, holdings, and URLs actually checked, not generated from
 * training memory) across 8 domains: eyewitness identification, false
 * confessions, jailhouse informants, Brady/disclosure, ineffective
 * assistance of counsel, forensic evidence, post-conviction relief/newly
 * discovered evidence, and wrongful-conviction research data.
 *
 * Every row's `status` reflects how confidently it was verified:
 * "verified" for sources confirmed via a successful live fetch of the
 * primary/official text; "under_review" for sources where verification hit
 * a snag (a 403 on direct fetch, corroborated only via a secondary source)
 * and a human editor should do one more manual check before promoting to
 * "approved" — never "approved" itself, since that's a human sign-off step
 * this script doesn't perform. Quality over quantity: weak/unverifiable
 * candidates were dropped by the researching agents rather than padded in.
 *
 * Shared by scripts/seed-knowledge-sources.ts (manual local runner) and a
 * one-time production migration route, same convention as
 * resource-seed-data.ts.
 */
import { db } from "@/db";
import { cases, knowledgeSourceIssueLinks, caseKnowledgeSourceLinks, knowledgeSources } from "@/db/schema";
import { ilike } from "drizzle-orm";

type SeedSource = {
  title: string;
  sourceKind: (typeof knowledgeSources.$inferInsert)["sourceKind"];
  authorityTier: number;
  jurisdiction?: string | null;
  citation?: string | null;
  organization?: string | null;
  summary: string;
  url?: string | null;
  publicationDate?: string | null; // ISO date or year; parsed at insert time
  status: "verified" | "under_review";
  issueTags: string[];
  /** Client name to look up in `cases` (case-insensitive substring) and
   * link this source to directly — used only where a source is about a
   * specific person who is also one of Xonorate's own documented cases. */
  relatedCaseClientName?: string;
};

export const KNOWLEDGE_SOURCE_SEED_DATA: SeedSource[] = [
  // --- Eyewitness Identification ---
  {
    title: "Neil v. Biggers",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "409 U.S. 188 (1972)",
    organization: "Supreme Court of the United States",
    publicationDate: "1972-12-06",
    url: "https://caselaw.findlaw.com/court/us-supreme-court/409/188.html",
    summary:
      "Issue: Whether a suggestive police station-house showup (the victim viewed the single suspect, without a lineup, seven months after a rape) violated due process. Holding: Suggestiveness alone does not require exclusion; admissibility turns on the totality of the circumstances, assessed through five reliability factors — (1) the witness's opportunity to view the criminal at the time of the crime, (2) the witness's degree of attention, (3) the accuracy of the witness's prior description, (4) the witness's level of certainty at the confrontation, and (5) the length of time between the crime and the confrontation — weighed against the corrupting effect of the suggestive procedure. Relevance: The doctrinal source of the \"Biggers factors\" still used today to evaluate identification reliability; several factors (especially witness certainty and cross-time description accuracy) are now understood by memory scientists to be unreliable proxies. Limitations: Predates Manson v. Brathwaite's two-step framework and virtually all modern eyewitness-memory science.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "Manson v. Brathwaite",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "432 U.S. 98 (1977)",
    organization: "Supreme Court of the United States",
    publicationDate: "1977-06-16",
    url: "https://caselaw.findlaw.com/court/us-supreme-court/432/98.html",
    summary:
      "Issue: Whether due process requires per se exclusion of an identification obtained through an unnecessarily suggestive procedure. Holding: The Court rejected a per se rule and adopted a two-step test: first ask whether the procedure was unnecessarily suggestive, then ask whether the identification is nonetheless reliable under the Biggers factors; \"reliability is the linchpin\" of admissibility. Relevance: The controlling federal constitutional standard for suggestive-identification challenges nationwide, and the backdrop for state reforms like State v. Henderson. Limitations: Relies on reliability factors (witness certainty, self-reported attention) now contradicted by a large body of psychological research showing they are poor, malleable indicators of accuracy.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "Perry v. New Hampshire",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "565 U.S. 228 (2012)",
    organization: "Supreme Court of the United States",
    publicationDate: "2012-01-11",
    url: "https://www.law.cornell.edu/supremecourt/text/10-8974",
    summary:
      "Issue: Whether due process requires a preliminary judicial reliability assessment of an eyewitness identification made under suggestive circumstances not arranged by police (a witness spontaneously identified the defendant from her window). Holding (8-1): No — due-process screening under Biggers/Brathwaite is triggered only when the suggestive circumstances were police-arranged; otherwise reliability is tested through ordinary trial safeguards (cross-examination, jury instructions, reasonable doubt). Relevance: Narrows the reach of the Biggers/Brathwaite due-process check considerably — most eyewitness-reliability problems without police misconduct get no special pretrial screening. Limitations: Does not disturb Biggers/Brathwaite for police-arranged suggestion; Sotomayor's dissent argued the majority undervalues non-police-arranged suggestion risk.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "State v. Henderson",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "NJ",
    citation: "208 N.J. 208, 27 A.3d 872 (2011)",
    organization: "Supreme Court of New Jersey",
    publicationDate: "2011-08-24",
    url: "https://www.courtlistener.com/opinion/1085989/state-of-new-jersey-v-larry-r-henderson/",
    summary:
      "Issue: Whether the Manson v. Brathwaite framework remains adequate given decades of subsequent memory-science research. Holding: After a special remand hearing reviewing extensive social-science evidence, the court held Manson inadequate and adopted a revised framework requiring a pretrial hearing (triggered by \"some evidence\" of suggestiveness) examining both \"system variables\" (blind administration, instructions, lineup composition, sequential vs. simultaneous presentation) and \"estimator variables\" (stress, weapon focus, distance, lighting, cross-racial identification), plus enhanced jury instructions on memory science. Relevance: The leading state-law model for eyewitness-identification reform nationally, cited by other state courts as evidence Manson is scientifically outdated. Limitations: Binding only in New Jersey; modifies state law rather than overruling Manson as federal constitutional law.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "Eyewitness Evidence: A Guide for Law Enforcement",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: "NCJ 178240",
    organization: "U.S. Department of Justice, National Institute of Justice",
    publicationDate: "1999-10-01",
    url: "https://nij.ojp.gov/library/publications/eyewitness-evidence-guide-law-enforcement",
    summary:
      "The first national guide of its kind, produced by a DOJ-convened working group of investigators, prosecutors, defense lawyers, and memory researchers, laying out recommended procedures for collecting eyewitness evidence: composing lineups so the suspect doesn't stand out, instructing witnesses that the perpetrator may not be present, conducting and documenting simultaneous/sequential procedures, and recording confidence statements. Useful as the baseline official statement of best practice against which any department's actual lineup conduct can be measured. Note: it stopped short of mandating double-blind administration, a position later research (including the 2014 National Academy of Sciences report) has revisited.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "Thirty Years of Investigating the Own-Race Bias in Memory for Faces: A Meta-Analytic Review",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "Psychology, Public Policy, and Law, 7(1), 3-35 (2001); DOI 10.1037/1076-8971.7.1.3",
    organization: "American Psychological Association (Meissner & Brigham)",
    publicationDate: "2001-01-01",
    url: "https://scholarworks.utep.edu/cgi/viewcontent.cgi?article=1004&context=christian_meissner",
    summary:
      "A meta-analysis of 39 studies (91 samples, ~5,000 participants) finding own-race faces produce significantly higher correct-identification rates and lower false-identification rates than other-race faces — the most-cited quantitative synthesis establishing that cross-racial identifications carry materially higher error risk. Limitations: largely laboratory recognition-memory studies, not field eyewitness-identification studies; establishes the effect's existence and size, not that any specific real-world identification was inaccurate.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "How Eyewitness Misidentification Can Send Innocent People to Prison",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: "2020-04-15",
    url: "https://innocenceproject.org/news/how-eyewitness-misidentification-can-send-innocent-people-to-prison/",
    summary:
      "Compiles documented statistics: eyewitness misidentification was a factor in 69% (252/367) of Innocence Project DNA exonerations tracked at time of writing, the most common contributing cause in that dataset; 82 DNA exonerations rested on a single eyewitness identification alone. An advocacy-organization summary, not legal authority — specific figures should be traced to underlying studies (e.g. Garrett's research, NRE data) before being cited standalone.",
    status: "verified",
    issueTags: ["Mistaken witness identification"],
  },
  {
    title: "Understanding the Registry — Mistaken Witness Identification",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: null,
    url: "https://exonerationregistry.org/understanding-registry",
    summary:
      "The Registry's methodology page defining \"Mistaken Witness Identification\" and describing its prevalence across the exoneration database, with the rate notably higher in sexual-assault exonerations specifically. VERIFICATION NOTE: the live statistics page returned a 403 to automated re-fetch during research — an editor should pull the current live figures directly from exonerationregistry.org before citing a specific percentage; treat this row as directional/organizational-context support pending that recheck, not a source of standalone statistics.",
    status: "under_review",
    issueTags: ["Mistaken witness identification"],
  },

  // --- False Confessions ---
  {
    title: "Miranda v. Arizona",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "384 U.S. 436 (1966)",
    organization: "Supreme Court of the United States",
    publicationDate: "1966-06-13",
    url: "https://www.oyez.org/cases/1965/759",
    summary:
      "Issue: Whether the Fifth Amendment privilege against self-incrimination requires procedural safeguards before custodial-interrogation statements can be used against a defendant. Holding (5-4): Before custodial interrogation, police must warn a suspect of the right to remain silent, that statements can be used against them, the right to an attorney, and appointed counsel if indigent; a valid waiver must be shown before admissibility. Relevance: The doctrinal starting point for virtually all confession/interrogation reform work, including false-confession litigation. Limitations: Governs disclosure of rights and waiver, not the separate due-process \"voluntariness\" test for coercion (see Colorado v. Connelly); does not require recording of interrogations; a technically Mirandized, validly-waived confession can still later be proven false.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "Colorado v. Connelly",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "479 U.S. 157 (1986)",
    organization: "Supreme Court of the United States",
    publicationDate: "1986-12-10",
    url: "https://www.oyez.org/cases/1986/85-660",
    summary:
      "Issue: Whether a confession can be held involuntary under due process based solely on the confessor's impaired mental state, with no police coercion (a man with chronic schizophrenia approached an officer unprompted and confessed). Holding (7-2): Coercive police activity is a necessary predicate to an involuntary-confession finding under due process; mental illness alone, without police coercion, does not render a confession involuntary — \"Miranda protects defendants against government coercion... it goes no further than that.\" Relevance: Establishes why mentally ill, intellectually disabled, or juvenile suspects who falsely confess without provable police coercion may get no due-process relief, underscoring the need for statutory/recording-based safeguards instead. Limitations: Does not hold mental condition irrelevant to reliability generally — only that it can't alone establish a due-process violation.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "Stephan v. State",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "AK",
    citation: "711 P.2d 1156 (Alaska 1985)",
    organization: "Supreme Court of Alaska",
    publicationDate: "1985-12-06",
    url: "https://www.courtlistener.com/opinion/1354456/stephan-v-state/",
    summary:
      "Issue: Whether the Alaska Constitution's due process clause requires electronic recording of custodial interrogations conducted in a place of detention. Holding: An unexcused failure to record such an interrogation violates due process under the Alaska Constitution, and an unrecorded statement is generally inadmissible; recording is required without exception in places of detention, covering the entire interview including Miranda warnings. Relevance: One of the first and most influential state high court rulings making recording an enforceable constitutional requirement rather than a best practice, later cited nationwide (including by Wisconsin's Jerrell C.J.). Limitations: Grounded solely in the Alaska Constitution — binds only Alaska; subject to a feasibility exception.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "In re Jerrell C.J.",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "WI",
    citation: "2005 WI 105, 699 N.W.2d 110 (Wis. 2005)",
    organization: "Supreme Court of Wisconsin",
    publicationDate: "2005-07-07",
    url: "https://www.courtlistener.com/opinion/1649143/state-v-jerrell-cj/",
    summary:
      "Issue: Whether a 14-year-old's confession, obtained after ~5.5 hours of interrogation without parental contact, was voluntary, and whether recording should be required for juvenile interrogations. Holding: The confession was involuntary under the totality of the circumstances; the court declined a per se rule for children under 16 without a parent/interested adult present, but used its supervisory authority to require electronic recording of juvenile custodial interrogations going forward, without exception at places of detention. Relevance: Leading state precedent specifically on juvenile interrogations — a population research shows is disproportionately vulnerable to false confessions; amici included the Innocence Project and Wisconsin Innocence Project. Limitations: A Wisconsin supervisory-power ruling, not federal constitutional law — binds only Wisconsin, prospectively.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "DOJ Policy on Electronic Recording of Statements",
    sourceKind: "agency_guidance",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: null,
    organization: "U.S. Department of Justice",
    publicationDate: "2014-05-22",
    url: "https://www.justice.gov/archives/opa/pr/attorney-general-holder-announces-significant-policy-shift-concerning-electronic-recording",
    summary:
      "DOJ press release announcing a department-wide presumption that the FBI, DEA, ATF, and U.S. Marshals will electronically record custodial interviews of individuals in federal detention after arrest but before initial court appearance (video preferred, audio fallback), covering the entire interview. Exceptions apply when the interviewee requests no recording or recording isn't practicable. Shows recording is now recognized DOJ-wide, not just at the state-court level, as a safeguard against disputed/coerced confessions. Limitations: a policy announcement, not a binding statute or court rule, and creates no individually enforceable right if a statement goes unrecorded.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "The Psychology of Confessions: A Review of the Literature and Issues",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "Psychological Science in the Public Interest, 5(2) (Nov. 2004); DOI 10.1111/j.1529-1006.2004.00016.x",
    organization: "Association for Psychological Science (Kassin et al.)",
    publicationDate: "2004-11-01",
    url: "https://pubmed.ncbi.nlm.nih.gov/26158993/",
    summary:
      "A peer-reviewed monograph by leading false-confession researcher Saul Kassin and colleagues tracing the interrogation process — pre-interrogation lie-detection (trained investigators shown prone to false-positive guilt judgments), Miranda waivers, modern psychological tactics (isolation, confrontation, minimization implying leniency) — through to confession. Distinguishes voluntary, compliant, and internalized false confessions; identifies personal risk factors (youth, intellectual disability, suggestibility) and situational risk factors (isolation, presented false evidence, minimization); documents confession evidence is highly prejudicial to juries even shown coercive/uncorroborated; recommends mandatory full-interrogation videotaping. The rigorous academic anchor for the psychological mechanisms behind false confessions.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "False Confessions — National Registry of Exonerations",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: "2022-04-10",
    url: "https://exonerationregistry.org/false-confessions",
    summary:
      "The Registry's dedicated false-confessions page, linking its data table on age/mental status of exonerees who falsely confessed (N=3,060 exonerations as of the April 2022 update) and explanatory articles by Registry co-founders on why innocent suspects confess and the documented link between false confessions and false guilty pleas (a false confessor is reported more than three times as likely to have also pleaded guilty). The authoritative, continuously updated statistical source on false confessions' role in documented exonerations and which populations are most affected.",
    status: "verified",
    issueTags: ["False confession"],
  },
  {
    title: "False Confessions — Innocence Project",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: null,
    url: "https://innocenceproject.org/false-confessions/",
    summary:
      "Explains how coercive interrogation tactics (intimidation, isolation, deception about evidence, promises of leniency) produce false admissions; notes false confessors were interrogated for up to 16 hours on average, and identifies children, people with intellectual disabilities, and people with language barriers as populations particularly vulnerable. A plain-language organizational summary — specific percentage-of-exonerations statistics live on the Innocence Project's separate exonerations-data page and should be pulled from there if an exact figure is needed.",
    status: "verified",
    issueTags: ["False confession"],
  },

  // --- Jailhouse Informants ---
  {
    title: "Napue v. Illinois",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "360 U.S. 264 (1959)",
    organization: "Supreme Court of the United States",
    publicationDate: "1959-06-15",
    url: "https://www.law.cornell.edu/supremecourt/text/360/264",
    summary:
      "Issue: Whether a prosecutor's knowing failure to correct a witness's false testimony about a leniency promise — going only to credibility, not guilt directly — violates due process. Holding: A state may not knowingly use false testimony to obtain a conviction, and this applies even where the falsehood concerns only a witness's credibility; the prosecutor's silent acquiescence in a false denial of a promised deal denied due process. Relevance: The doctrinal root of Giglio's later disclosure extension; directly establishes that a prosecutor cannot let an informant falsely deny a deal — the single most common accuracy problem in jailhouse-informant cases. Limitations: Requires \"any reasonable likelihood\" the false testimony affected the verdict — not a strict-liability rule, and applies only to knowing use of false testimony.",
    status: "verified",
    issueTags: ["Jailhouse informants", "Official misconduct"],
  },
  {
    title: "Giglio v. United States",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "405 U.S. 150 (1972)",
    organization: "Supreme Court of the United States",
    publicationDate: "1972-02-24",
    url: "https://www.law.cornell.edu/supremecourt/text/405/150",
    summary:
      "Issue: Whether an undisclosed leniency promise to the government's key witness — made by one prosecutor and unknown to the prosecutor who tried the case — violates due process. Holding: Evidence bearing on witness credibility falls within the Brady disclosure rule; a promise by one attorney is attributed to the government as a whole (\"the prosecutor's office is an entity\"); the question is whether the omission could, in any reasonable likelihood, have affected the jury's judgment. Relevance: The foundational case requiring disclosure of any deal or benefit given to a cooperating witness — directly applicable to jailhouse informants, whose credibility often turns entirely on undisclosed benefits. Limitations: Does not itself define materiality precisely (refined later in Bagley); addresses nondisclosure of an existing promise, not corroboration requirements, which are left to state law.",
    status: "verified",
    issueTags: ["Jailhouse informants", "Official misconduct"],
  },
  {
    title: "725 Illinois Compiled Statutes 5/115-21 (Informant Testimony)",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "IL",
    citation: "725 ILCS 5/115-21",
    organization: "Illinois General Assembly",
    publicationDate: "2004-01-01",
    url: "https://codes.findlaw.com/il/chapter-725-criminal-procedure/il-st-sect-725-5-115-21/",
    summary:
      "Provision: For specified serious offenses (first-degree murder and related homicide, aggravated criminal sexual assault, aggravated arson), requires the prosecution to disclose an informant's full criminal history, any deals, statement details, recantation history, and other cases where they testified, at least 30 days before trial; requires a pretrial reliability hearing (prosecution bears burden by a preponderance of the evidence) unless waived. Relevance: One of the few states with a statutory pretrial reliability-screening mechanism specifically for jailhouse informants, born of Illinois's death-penalty wrongful-conviction reforms. Limitations: Creates an admissibility screen, not a blanket corroboration requirement, and only applies to the enumerated offense categories.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },
  {
    title: "Texas Code of Criminal Procedure Article 38.075 (Corroboration of Certain Testimony Required)",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "TX",
    citation: "Tex. Code Crim. Proc. art. 38.075",
    organization: "Texas Legislature",
    publicationDate: "2009-09-01",
    url: "https://codes.findlaw.com/tx/code-of-criminal-procedure/crim-ptx-crim-pro-art-38-075.html",
    summary:
      "Provision: Bars conviction based solely on the uncorroborated testimony of a jailhouse informant (a person to whom the defendant allegedly made a statement while both were incarcerated); corroboration merely showing the offense occurred is insufficient. Relevance: Enacted directly in response to the 2001 Dallas \"fake drugs\" scandal — a clear legislative response to a documented informant-driven wrongful-conviction pattern. Limitations: Applies only to in-custody statement testimony as defined by the statute; Texas courts have litigated what corroboration quantum suffices.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },
  {
    title: "California Penal Code §§ 1111.5 and 1127a (In-Custody Informant Corroboration, Jury Instruction, Disclosure)",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "CA",
    citation: "Cal. Penal Code §§ 1111.5, 1127a (S.B. 687, Stats. 2011)",
    organization: "California State Legislature",
    publicationDate: "2012-01-01",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=1111.5",
    summary:
      "Provision: § 1111.5 bars conviction (or a true special-circumstance/aggravating-fact finding) based on uncorroborated in-custody-informant testimony, and bars one informant from corroborating another absent proof they didn't communicate. § 1127a requires, on request, a cautionary jury instruction and pretrial written disclosure of all consideration promised to the informant. Relevance: California is one of the few states with both a statutory corroboration bar and mandatory cautionary instruction for jailhouse informants. Limitations: A broader 2017-18 bill (AB 359) that would have added a statewide informant-tracking database died in the Senate and was never enacted — no such statewide database currently exists; the operative law remains this 2011 framework.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },
  {
    title: "The Truth About Snitches: An Archival Analysis of Informant Testimony",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "Psychiatry, Psychology and Law (2022 online; print 2023)",
    organization: "Neuschatz, DeLoach, Hillgartner, Fessinger, Wetmore, Douglass, Bornstein, Le Grand",
    publicationDate: "2022-01-01",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9090405/",
    summary:
      "Peer-reviewed content analysis of 53 informants across 22 DNA exoneration cases with demonstrably false informant testimony. Found ~75% of informants explicitly denied receiving any benefit despite having deals, ~64% showed testimonial inconsistencies, and that accurate peripheral details (informants' accounts averaged ~2/3 factually accurate on crime details) made a false core narrative seem credible to jurors (\"truth-default\" theory). Limitations: sample is limited to 22 known-false-testimony cases, so it documents a known-false sample, not a representative one, and can't estimate the base rate of false testimony among all testifying informants.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },
  {
    title: "Sometimes the Snitch Recants: A Closer Look at the Use of Jailhouse Informants in DNA Exoneration Cases",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "4 Wrongful Conviction L. Rev. 71 (2023)",
    organization: "Heath, Stein, Singh, Holden — Wrongful Conviction Law Review",
    publicationDate: "2023-01-01",
    url: "https://wclawr.org/index.php/wclr/article/view/96",
    summary:
      "Examined the first 375 Innocence Project DNA exonerations; found jailhouse-informant testimony present in ~15%, sole evidence for conviction in ~13% of all cases studied; among informant-involved cases, ~24% later saw the informant recant, and 13% of recantation cases had relied exclusively on that testimony for conviction. Argues reform proposals (corroboration, disclosure, reliability hearings) should explicitly account for recantation being common, not a rare edge case. Limitations: restricted to the first 375 Innocence Project DNA exonerations, a historical non-representative subset skewed toward preserved-biological-evidence cases.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },
  {
    title: "Jailhouse Informants — National Registry of Exonerations",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: "2024-09-26",
    url: "https://exonerationregistry.org/jailhouse-informants",
    summary:
      "The Registry's data page on jailhouse informants: as of the cited date, informants testified against ~7% of all exonerees (247 of 3,591), but usage is heavily concentrated in the most serious cases — over 80% of trials involving jailhouse informants were murder cases, and informants appear in ~15% of murder exonerations vs. ~2% of exonerations for other crime types. Limitations: a curated case-tracking database, not a peer-reviewed study; scope limited to documented exonerations, understating the true frequency including undocumented wrongful convictions.",
    status: "verified",
    issueTags: ["Jailhouse informants"],
  },

  // --- Brady / Prosecutorial Disclosure ---
  {
    title: "Brady v. Maryland",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "373 U.S. 83 (1963)",
    organization: "Supreme Court of the United States",
    publicationDate: "1963-05-13",
    url: "https://www.law.cornell.edu/supremecourt/text/373/83",
    summary:
      "Issue: Whether the prosecution's failure to disclose a co-defendant's confession, favorable to the defendant on punishment, violated due process. Holding: The suppression by the prosecution of evidence favorable to an accused upon request violates due process where the evidence is material to guilt or punishment, irrespective of the prosecution's good or bad faith. Relevance: The foundational case creating the constitutional disclosure duty behind nearly every wrongful-conviction claim involving withheld evidence — intent to conceal is irrelevant; negligent suppression can still violate due process. Limitations: Originally framed around a defense request and didn't precisely define \"materiality\" — both were substantially refined in Agurs, Bagley, Kyles, and Strickler; citing Brady alone risks an incomplete statement of the current rule.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "United States v. Bagley",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "473 U.S. 667 (1985)",
    organization: "Supreme Court of the United States",
    publicationDate: "1985-07-02",
    url: "https://www.law.cornell.edu/supremecourt/text/473/667",
    summary:
      "Issue: What materiality standard governs Brady claims, and does it vary by the type of disclosure request made. Holding: Suppressed evidence is material only if there is a \"reasonable probability that, had the evidence been disclosed, the result of the proceeding would have been different\" — a single standard applying regardless of request type, and applying equally to exculpatory and impeachment evidence. Relevance: Establishes the current, controlling materiality formula still cited today (reaffirmed in Kyles and Strickler). Limitations: A fractured opinion; dissents argued the unified standard under-protects defendants who made a specific request met with silence.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "Kyles v. Whitley",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "514 U.S. 419 (1995)",
    organization: "Supreme Court of the United States",
    publicationDate: "1995-04-19",
    url: "https://www.law.cornell.edu/supremecourt/text/514/419",
    summary:
      "Issue: Whether a conviction must be vacated where police (not just prosecutors) held favorable evidence never disclosed, and how materiality is assessed across multiple undisclosed items. Holding: Materiality is judged by the cumulative effect of all suppressed evidence, not item-by-item; the prosecutor has a duty to learn of favorable evidence known to others acting on the government's behalf, including police, and that duty isn't excused because police (not the prosecutor personally) held it. Relevance: Directly addresses the common wrongful-conviction pattern of police withholding evidence from prosecutors — the disclosure duty extends to law enforcement's files. Limitations: Applies, rather than creates, Bagley's standard; clarifies the defendant need only undermine confidence in the verdict, a narrower inquiry than a sufficiency-of-evidence claim.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "Strickler v. Greene",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "527 U.S. 263 (1999)",
    organization: "Supreme Court of the United States",
    publicationDate: "1999-06-17",
    url: "https://caselaw.findlaw.com/court/us-supreme-court/527/263.html",
    summary:
      "Issue: Whether a Brady claim raised after procedural default entitled the petitioner to habeas relief where police files with undisclosed witness-credibility material surfaced post-trial. Holding: Articulates the three-part Brady test — (1) evidence favorable to the accused, exculpatory or impeaching, (2) suppressed by the state, willfully or inadvertently, (3) prejudice resulted. Relief was denied here because, despite meeting the first two prongs, the petitioner failed to show prejudice given the strength of the remaining evidence. Relevance: The most-cited operative checklist for analyzing any Brady claim. Limitations: Illustrates that meeting the first two prongs is not enough — the materiality/prejudice prong is frequently decisive and hardest to satisfy, a pattern relevant to why many valid-seeming Brady claims still fail.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "Justice Manual 9-5.001 — Policy Regarding Disclosure of Exculpatory and Impeachment Information",
    sourceKind: "agency_guidance",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: "Justice Manual § 9-5.001",
    organization: "U.S. Department of Justice",
    publicationDate: "2020-01-01",
    url: "https://www.justice.gov/jm/jm-9-5000-issues-related-trials-and-other-court-proceedings",
    summary:
      "DOJ's internal policy directing federal prosecutors to disclose beyond the constitutional Brady/Giglio/Kyles floor — including anything inconsistent with a charged element, establishing a recognized affirmative defense, or casting substantial doubt on evidence accuracy — and to \"take a broad view of materiality and err on the side of disclosure.\" Useful because it shows the gap between DOJ's own recommended best practice and the constitutional minimum; many documented Brady problems involve prosecutors meeting (or falling short of) the bare constitutional floor rather than this more protective internal standard.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "Government Misconduct and Convicting the Innocent: The Role of Prosecutors, Police and Other Law Enforcement",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations (Gross, Possley, Roll, Stephens)",
    publicationDate: "2020-09-15",
    url: "https://repository.law.umich.edu/other/165",
    summary:
      "The Registry's flagship empirical study of official misconduct across the first 2,400 exonerations (as of Feb. 2019): misconduct contributed to more than half of all wrongful convictions studied, rising to ~three-quarters in homicide cases; concealing exculpatory evidence (Brady-type violations) was the single most common form of misconduct, present in 44% of misconduct cases; misconduct was substantially more common where the defendant was Black; police were disciplined at roughly five times the rate of prosecutors for comparable misconduct. The leading quantitative source on how often Brady-type failures actually drive wrongful convictions.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },
  {
    title: "Addressing Official Misconduct: Increasing Accountability in Reducing Wrongful Convictions",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "1 Wrongful Conviction L. Rev. 270 (2020)",
    organization: "Drummond & Mills — Wrongful Conviction Law Review",
    publicationDate: "2020-12-21",
    url: "https://wclawr.org/index.php/wclr/article/view/34",
    summary:
      "Analyzing NRE data (official misconduct a contributing factor in 1,404 of 2,601 exonerations reviewed), focused on murder cases, finding law enforcement/prosecutors involved in wrongful convictions frequently reappear across multiple cases (repeat actors, not isolated errors), with Black exonerees disproportionately affected. Argues for stronger structural accountability mechanisms. A peer-reviewed complement to the NRE's own report, focused specifically on recurrence/accountability.",
    status: "verified",
    issueTags: ["Official misconduct"],
  },

  // --- Ineffective Assistance of Counsel ---
  {
    title: "Strickland v. Washington",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "466 U.S. 668 (1984)",
    organization: "Supreme Court of the United States",
    publicationDate: "1984-05-14",
    url: "https://caselaw.findlaw.com/court/us-supreme-court/466/668.html",
    summary:
      "Issue: Whether capital trial counsel was constitutionally ineffective for not seeking more mitigating evidence before sentencing. Holding: Establishes the controlling two-part test: (1) deficient performance — counsel's performance fell outside the wide range of reasonable professional assistance, and (2) prejudice — a reasonable probability that, but for the errors, the result would have been different, sufficient to undermine confidence in the outcome. Counsel \"has a duty to make reasonable investigations or to make a reasonable decision that makes particular investigations unnecessary.\" Relevance: The foundational case underlying virtually every ineffective-assistance claim in wrongful-conviction litigation. Limitations: Directs \"highly deferential\" review with \"a strong presumption\" of reasonable performance, making the standard notoriously difficult to satisfy — including for actually-innocent defendants.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },
  {
    title: "Hinton v. Alabama",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "571 U.S. 263 (2014)",
    organization: "Supreme Court of the United States",
    publicationDate: "2014-02-24",
    url: "https://supreme.justia.com/cases/federal/us/571/263/",
    summary:
      "Issue: Whether capital defendant Anthony Ray Hinton's counsel was ineffective under Strickland for failing to seek more funding for a qualified toolmark/ballistics expert. Holding: Unanimous (9-0) per curiam: counsel's failure was deficient performance because it rested on a mistaken belief — contradicted by the actual statute — that funding was capped at $1,000, not a strategic choice; \"an attorney's ignorance of a point of law that is fundamental to his case combined with his failure to perform basic research on that point is a quintessential example of unreasonable performance.\" Remanded on prejudice. Relevance: Directly applies Strickland to the failure-to-retain-an-expert context central to many forensic-evidence wrongful convictions. Limitations: A narrow per curiam summary reversal on the deficient-performance prong only; did not itself find prejudice or grant relief.",
    status: "verified",
    issueTags: ["Inadequate legal defense", "False or misleading forensic evidence"],
    relatedCaseClientName: "Hinton",
  },
  {
    title: "Lafler v. Cooper",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "566 U.S. 156 (2012)",
    organization: "Supreme Court of the United States",
    publicationDate: "2012-03-21",
    url: "https://supreme.justia.com/cases/federal/us/566/156/",
    summary:
      "Issue: What showing of Strickland prejudice is required when a defendant rejects a favorable plea offer on deficient advice and is convicted at trial on a harsher sentence. Holding: A defendant must show a reasonable probability that (1) they would have accepted the plea absent the bad advice, (2) the court would have accepted its terms, and (3) the resulting conviction/sentence would have been less severe; the remedy is generally requiring the prosecution to reoffer the plea. Relevance: Extends Strickland into plea bargaining, where most criminal cases — including wrongful convictions from coerced/poorly-advised pleas — are actually resolved. Limitations: A 5-4 decision with a sharp dissent arguing the remedy exceeds courts' proper role.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },
  {
    title: "Performance Guidelines for Indigent Defense Representation in Non-Capital Criminal Cases at the Trial Level",
    sourceKind: "agency_guidance",
    authorityTier: 2,
    jurisdiction: "NC",
    citation: "N.C. Gen. Stat. § 7A-498.5(c)(4) (authorizing statute)",
    organization: "North Carolina Commission on Indigent Defense Services",
    publicationDate: "2004-11-12",
    url: "https://www.ncids.org/wp-content/uploads/2025/06/Trial-Level-Final-Performance-Guidelines.pdf",
    summary:
      "Official state indigent-defense performance standards (modeled on national NLADA guidelines) translating the constitutional Strickland standard into concrete duties — Guideline 4.1 states counsel \"has a duty to conduct an independent case review and investigation,\" not obviated by the client's own admissions of guilt, detailing sources to investigate (witnesses, scene, physical evidence, experts, records). Note: the guidelines explicitly disclaim serving as a benchmark for ineffective-assistance claims or attorney discipline.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },
  {
    title: "Court Findings of Ineffective Assistance of Counsel Claims in Post-Conviction Appeals Among the First 255 DNA Exoneration Cases",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project (Dr. Emily M. West)",
    publicationDate: "2010-09-01",
    url: "https://innocenceproject.org/wp-content/uploads/2016/05/Innocence_Project_IAC_Report.pdf",
    summary:
      "Empirical study of published appellate decisions for the first 255 DNA exonerations: 54 of 255 (21%) raised IAC claims on appeal; courts rejected 81% (44/54), found IAC leading to reversal/relief in 13% (7/54). Most common documented deficiencies: failure to present defense witnesses, failure to seek DNA/serology testing, failure to object to prosecutorial argument, failure to interview/cross-examine witnesses. Also cites a National Center for State Courts finding that IAC claims succeed in only ~8% of state habeas cases generally. Empirical backbone for the claim that Strickland's high bar leaves demonstrably innocent people without a remedy for bad lawyering. Limitations: published-opinions only (undercounts unpublished/unappealed cases), DNA-exoneration cases only, now 15+ years old.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },
  {
    title: "Inadequate Legal Defense — National Registry of Exonerations",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: null,
    url: "https://exonerationregistry.org/inadequate-legal-defense",
    summary:
      "The Registry's page on inadequate legal defense as a documented contributing factor: recorded in roughly 26% of all tracked exonerations (823 of 3,159), with recent annual reports showing higher rates in individual years. Frames the pattern as overworked, underfunded defense counsel failing to investigate, call witnesses, or prepare adequately. Limitations: the Registry's factor coding is a case-by-case researcher judgment, not a court finding of Sixth Amendment ineffectiveness — the categories overlap but aren't identical, and figures shift as the database grows.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },
  {
    title: "Inadequate Defense — Innocence Project",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: null,
    url: "https://innocenceproject.org/inadequate-defense/",
    summary:
      "Distinguishes extreme individual misconduct (an attorney sleeping through trial, later disbarred) from the far more common pattern: systemic resource gaps — public defenders lacking investigators, experts, training, and compensation to meaningfully test the prosecution's case. Cites a 2022 American Bar Association finding that public defender funding would need to roughly triple nationally to meet the Sixth Amendment guarantee. Limitations: an advocacy/public-education page summarizing other research rather than presenting primary data — trace statistics back to the underlying ABA report where possible.",
    status: "verified",
    issueTags: ["Inadequate legal defense"],
  },

  // --- Forensic Evidence ---
  {
    title: "Daubert v. Merrell Dow Pharmaceuticals, Inc.",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "509 U.S. 579 (1993)",
    organization: "Supreme Court of the United States",
    publicationDate: "1993-06-28",
    url: "https://www.law.cornell.edu/supct/html/92-102.ZS.html",
    summary:
      "Issue: What standard governs admission of expert scientific testimony in federal court. Holding: Federal Rule of Evidence 702, not the older Frye \"general acceptance\" test, governs; trial judges act as gatekeepers assessing scientific reliability and relevance, considering factors like testability, peer review/publication, known error rate, controlling standards, and general acceptance. Relevance: The foundational admissibility standard cited in nearly every challenge to forensic expert testimony (hair microscopy, bite marks, firearms/toolmarks, bloodstain pattern analysis). Limitations: Concerned pharmaceutical/toxicology evidence, not forensic pattern-matching directly; binds federal courts (extended beyond \"scientific\" testimony in Kumho Tire, 1999), but many states still apply Frye or their own variant.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },
  {
    title: "District Attorney's Office for the Third Judicial District v. Osborne",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "557 U.S. 52 (2009)",
    organization: "Supreme Court of the United States",
    publicationDate: "2009-06-18",
    url: "https://www.law.cornell.edu/supct/html/08-6.ZS.html",
    summary:
      "Issue: Does a convicted person have a constitutional due-process right to post-conviction DNA testing of the state's biological evidence, via a § 1983 suit. Holding (5-4): No freestanding substantive due process right; existing state procedures were adequate, and the Court declined to constitutionalize a right given the 46 states and federal government that had already enacted DNA-access statutes. Relevance: Establishes that DNA-testing access is a matter of statute, not constitutional guarantee — the operative legal pathway runs through state/federal DNA-access statutes. Limitations: Narrow holding on the civil § 1983 claim; leaves room for state statutory claims and as-applied due process challenges to inadequate procedures.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence", "DNA testing"],
  },
  {
    title: "18 U.S.C. § 3600 — Post-Conviction DNA Testing (Innocence Protection Act of 2004)",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "18 U.S.C. §§ 3600, 3600A; Title IV of Pub. L. No. 108-405, 118 Stat. 2260",
    organization: "United States Congress",
    publicationDate: "2004-10-30",
    url: "https://www.law.cornell.edu/uscode/text/18/3600",
    summary:
      "Establishes a federal procedure for people convicted of federal offenses to petition for post-conviction DNA testing on a sworn claim of actual innocence, with nine statutory prerequisites a court must find (evidence collected in connection with the case, not previously tested or retestable with newer technology, identity at issue, etc.), expedited timelines in capital cases, and CODIS database searches on favorable results. § 3600A requires preservation of biological evidence. A rebuttable presumption against timeliness attaches after 36 months post-conviction. Relevance: The actual operative federal mechanism for DNA-testing access, distinct from any constitutional right (see Osborne). Limitations: Applies only to federal convictions; each state has its own separate statute with different eligibility criteria and deadlines.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence", "DNA testing", "Post-conviction relief", "Actual innocence"],
  },
  {
    title: "Strengthening Forensic Science in the United States: A Path Forward",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: "DOI: 10.17226/12589",
    organization: "National Academy of Sciences / National Research Council",
    publicationDate: "2009-01-01",
    url: "https://nap.nationalacademies.org/read/12589/chapter/1",
    summary:
      "Congressionally mandated landmark report: apart from nuclear DNA analysis, no forensic discipline had at that time rigorously demonstrated its ability to consistently link evidence to a specific individual with a known error rate; many pattern-comparison fields (hair microscopy, bite marks, firearms/toolmarks) had never been validated through rigorous error-rate studies; crime labs lacked mandatory accreditation and independence from law enforcement; courtroom testimony often overstated certainty beyond what the science supported. Recommended removing public labs from law-enforcement administrative control. The single most-cited government document establishing that DNA analysis and many pattern-matching disciplines occupy very different scientific footing.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },
  {
    title: "FBI Testimony on Microscopic Hair Analysis Contained Errors in at Least 90 Percent of Cases in Ongoing Review",
    sourceKind: "agency_guidance",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: null,
    organization: "Federal Bureau of Investigation / U.S. Department of Justice (with Innocence Project, NACDL)",
    publicationDate: "2015-04-20",
    url: "https://www.fbi.gov/news/press-releases/fbi-testimony-on-microscopic-hair-analysis-contained-errors-in-at-least-90-percent-of-cases-in-ongoing-review",
    summary:
      "Official FBI/DOJ statement on a joint review (with the Innocence Project and NACDL) of historic FBI hair-microscopy testimony predating routine mitochondrial DNA testing: of the first 268 trial transcripts reviewed, testimony contained scientifically invalid, overstated conclusions in 257 (96%); 26 of 28 examiners had erred at least once; in death-penalty cases, errors were found in 33 of 35 (94%), and nine of those defendants had already been executed. A direct government admission (not third-party allegation) with specific error counts — the strongest possible sourcing for hair-microscopy unreliability claims. Limitations: covers only FBI Laboratory involvement and pre-2000 testimony predating mtDNA hair testing; describes testimony overstatement, not that the method can never be validly performed.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },
  {
    title: "Forensic Science in Criminal Courts: Ensuring Scientific Validity of Feature-Comparison Methods (PCAST Report)",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: null,
    organization: "President's Council of Advisors on Science and Technology",
    publicationDate: "2016-09-20",
    url: "https://obamawhitehouse.archives.gov/sites/default/files/microsites/ostp/PCAST/pcast_forensics_addendum_finalv2.pdf",
    summary:
      "Discipline-specific validity review: single-source/simple-mixture DNA analysis and latent fingerprint analysis were found to have adequate foundational validity (though fingerprint studies suggested a higher false-positive rate than often claimed in court); bitemark comparison was found to lack foundational validity; firearms/toolmark analysis fell short of foundational validity due to insufficient appropriately-designed studies at the time — not shown invalid, but insufficiently tested. Useful for precise, discipline-by-discipline claims rather than overgeneralizing \"forensics is unreliable.\" Limitations: an executive-branch advisory report, not a binding rule; some forensic organizations disputed the firearms conclusions, and further studies have been published since 2016.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },
  {
    title: "Bitemark Analysis: A NIST Scientific Foundation Review",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: "NIST IR 8352; DOI: 10.6028/NIST.IR.8352",
    organization: "National Institute of Standards and Technology",
    publicationDate: "2023-03-07",
    url: "https://www.nist.gov/publications/bitemark-analysis-nist-scientific-foundation-review",
    summary:
      "A dedicated scientific foundation review (400+ sources) examining bitemark analysis's core premises: that dentition is unique, that uniqueness transfers accurately onto skin, and that examiners can accurately interpret it. NIST concluded current research does not support these premises and that bitemark analysis, as practiced, is \"not supported by sufficient data.\" The most recent, most granular official review focused solely on bitemark comparison. Limitations: a scientific foundation review, not a binding legal/regulatory rule, though citable in Daubert/Frye admissibility challenges.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },
  {
    title: "Misapplication of Forensic Science",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: null,
    url: "https://innocenceproject.org/misapplication-of-forensic-science/",
    summary:
      "States misapplied forensic science contributed to more than half of the Innocence Project's DNA-exoneration cases and nearly a quarter of all wrongful convictions tracked since 1989 — the second most common contributing factor in their dataset. Names nine disciplines with significant documented weaknesses (bite marks, hair comparison, tool marks, arson investigation, fingerprints, dog scent evidence, comparative bullet lead analysis, shaken baby syndrome, bloodstain pattern analysis) and distinguishes never-validated techniques, misleading testimony, and outright misconduct as separate failure modes. Limitations: advocacy-organization content reflecting IP's own case population, not a peer-reviewed or government dataset; percentages are approximate framing language.",
    status: "verified",
    issueTags: ["False or misleading forensic evidence"],
  },

  // --- Post-Conviction Relief / Newly Discovered Evidence / Actual Innocence ---
  {
    title: "28 U.S.C. § 2254 — Federal Habeas Corpus for State Prisoners",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "28 U.S.C. § 2254",
    organization: "United States Congress",
    publicationDate: "1996-01-01",
    url: "https://www.law.cornell.edu/uscode/text/28/2254",
    summary:
      "Provision: A federal court may grant habeas relief to a state prisoner only if custody violates the Constitution, laws, or treaties of the U.S.; the petitioner must first exhaust state remedies (narrow exceptions apply); state factual findings are presumed correct absent clear and convincing rebuttal; relief on claims already adjudicated on the merits requires showing the state decision was contrary to, or an unreasonable application of, clearly established federal law. § (e)(2) sharply restricts new evidentiary hearings. Relevance: The core federal statute governing state-prisoner habeas litigation, including the procedural backdrop for actual-innocence gateway claims. Limitations: Creates the very procedural bars (exhaustion, deference, restricted hearings) that Schlup/McQuiggin carve a narrow exception into.",
    status: "verified",
    issueTags: ["Post-conviction relief"],
  },
  {
    title: "Herrera v. Collins",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "506 U.S. 390 (1993)",
    organization: "Supreme Court of the United States",
    publicationDate: "1993-01-25",
    url: "https://www.law.cornell.edu/supct/html/91-7328.ZS.html",
    summary:
      "Issue: Whether a freestanding actual-innocence claim based on newly discovered evidence, without an independent constitutional violation, entitles a state prisoner to federal habeas relief. Holding: No — such claims have never been held to state a ground for federal habeas relief absent an independent constitutional violation; even assuming a truly persuasive freestanding claim in a capital case would warrant relief, the threshold would be \"extraordinarily high,\" and Herrera's hearsay evidence fell well short. Relevance: Establishes federal habeas is not a freestanding innocence-adjudication forum; innocence functions as a \"gateway\" (Schlup), not an independent claim. Limitations: Leaves open only a hypothetical, undefined \"extraordinarily high\" bar the Court has never actually granted, and points instead to executive clemency as the traditional remedy.",
    status: "verified",
    issueTags: ["Post-conviction relief", "Actual innocence", "Newly discovered evidence"],
  },
  {
    title: "Schlup v. Delo",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "513 U.S. 298 (1995)",
    organization: "Supreme Court of the United States",
    publicationDate: "1995-01-23",
    url: "https://www.law.cornell.edu/supremecourt/text/513/298",
    summary:
      "Issue: Whether a habeas petitioner barred by procedural default may still get merits review of a constitutional claim by showing actual innocence. Holding: A petitioner may pass through the \"gateway\" by showing it is more likely than not that no reasonable juror would have convicted in light of new evidence; courts may consider the new evidence's probative force regardless of its trial admissibility. Relevance: The foundational case establishing the actual-innocence gateway used to overcome procedural default in federal habeas. Limitations: Innocence itself is not a constitutional claim — it only unlocks review of an independent underlying violation; the Court called such showings \"rare\" and \"extraordinary.\"",
    status: "verified",
    issueTags: ["Post-conviction relief", "Actual innocence", "Newly discovered evidence"],
  },
  {
    title: "McQuiggin v. Perkins",
    sourceKind: "case_law",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "569 U.S. 383 (2013)",
    organization: "Supreme Court of the United States",
    publicationDate: "2013-05-28",
    url: "https://www.law.cornell.edu/supremecourt/text/12-126",
    summary:
      "Issue: Whether the Schlup actual-innocence gateway can overcome AEDPA's one-year habeas filing deadline, not just procedural default. Holding: Yes — a convincing Schlup showing serves as a gateway allowing an otherwise time-barred claim to proceed on the merits; there's no separate diligence precondition, though unexplained delay bears on whether the showing has actually been made. Relevance: Extends the Schlup gateway to AEDPA's limitations period, controlling for untimely innocence-based petitions. Limitations: Applies only to \"a severely confined category\" of cases meeting the demanding more-likely-than-not standard; courts scrutinize late-arriving evidence more skeptically.",
    status: "verified",
    issueTags: ["Post-conviction relief", "Actual innocence", "Newly discovered evidence"],
  },
  {
    title: "Habeas Corpus (Glossary of Legal Terms)",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: null,
    organization: "Administrative Office of the U.S. Courts",
    publicationDate: null,
    url: "https://www.uscourts.gov/glossary-legal-terms/habeas-corpus",
    summary:
      "Official plain-language explainer from the federal judiciary describing habeas corpus as a judicial order compelling custodians to justify continued confinement, and noting federal judges regularly receive petitions from state prisoners alleging their prosecution violated federally protected rights. A concise, authoritative companion to the § 2254 statutory text for a general audience.",
    status: "verified",
    issueTags: ["Post-conviction relief"],
  },
  {
    title: "Not All Evidence is the Same: Habeas Corpus and Actual Innocence",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: "federal",
    citation: "Journal of Criminal Law and Criminology Online (2023)",
    organization: "Samantha C. Olexa — Northwestern Pritzker School of Law",
    publicationDate: "2023-01-01",
    url: "https://jclc.law.northwestern.edu/articles/not-all-evidence-is-the-same-habeas-corpus-and-actual-innocence-a-practically-unusable-exception-for-fundamental-miscarriages-of-justice/",
    summary:
      "Argues the Schlup/McQuiggin actual-innocence gateway is practically difficult to use due to a circuit split over what counts as qualifying \"new\" evidence — some circuits require evidence not reasonably available at trial (\"newly discovered\"), others allow any evidence newly presented to the habeas court regardless of trial availability (\"newly presented\") — and that the stricter standard undermines the doctrine's remedial purpose. Directly supports the point that the gateway, while doctrinally available since Schlup, is genuinely hard to win due to unsettled, circuit-dependent evidentiary thresholds.",
    status: "verified",
    issueTags: ["Post-conviction relief", "Actual innocence", "Newly discovered evidence"],
  },
  {
    title: "DNA Exonerations in the United States (1989-2020)",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: "2020-01-01",
    url: "https://innocenceproject.org/dna-exonerations-in-the-united-states/",
    summary:
      "375 DNA exonerees as of the reporting period, averaging 14 years served; 69% involved eyewitness misidentification, 43% misapplied forensic science, 29% false confessions. Notes DNA exonerations represent only ~15% of documented exonerations nationally — most exonerations proceed through non-DNA evidence. Establishes the real-world scale of DNA testing (enabled by statutes like 18 U.S.C. § 3600 and state equivalents) as an exoneration pathway, and that it's a minority pathway overall.",
    status: "verified",
    issueTags: ["Post-conviction relief", "DNA testing", "Wrongful conviction research"],
  },
  {
    title: "National Registry of Exonerations 2024 Annual Report",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: "2025-04-01",
    url: "https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2024_Annual_Report.pdf",
    summary:
      "147 exonerations in 2024, averaging 13.5 years lost per exoneree; official misconduct present in at least 104 (79% of homicide exonerations); Innocence Organizations and Conviction Integrity Units together drove 63% of all 2024 exonerations (Innocence Organizations in 53 cases, CIUs in 62, jointly in 22). Documents that dedicated organizations and prosecutor-run integrity units — not ad hoc individual habeas litigation — drive most successful outcomes, and DNA is present in only a minority of cases. VERIFICATION NOTE: the PDF returned a 403 to direct automated fetch; figures were corroborated via independently-confirmed secondary reporting (Criminal Legal News) rather than a direct read of the primary PDF — an editor should do one final direct check of the URL before treating this as fully verified.",
    status: "under_review",
    issueTags: ["Post-conviction relief", "Wrongful conviction research"],
  },

  // --- Wrongful-Conviction Research Data ---
  {
    title: "Exonerations by Contributing Factor",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: "2026-09-14",
    url: "https://exonerationregistry.org/exonerations-contributing-factor",
    summary:
      "The Registry's live statistics page (pulled 2026-09-14): of 3,859 cumulative exonerations since 1989 (36,144+ years lost), documented contributing-factor rates were Perjury or False Accusation 64.32%, Official Misconduct 60.82%, False or Misleading Forensic Evidence 29.23%, Mistaken Witness ID 27.16%, False Confession 12.67% (cases can involve more than one factor; percentages don't sum to 100%). This is a live, continuously updated counter — cite the access date alongside any figure pulled from it, since it will drift as new exonerations are logged.",
    status: "verified",
    issueTags: ["Wrongful conviction research"],
  },
  {
    title: "National Registry of Exonerations — 2025 Annual Report",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "National Registry of Exonerations",
    publicationDate: "2026-04-06",
    url: "https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2025Exonerations.pdf",
    summary:
      "Fixed dated annual snapshot: 97 exonerations in 2025; official misconduct in 70 (72%); mistaken witness ID in 22 (23%); false confessions in 19 (20%); perjury/false accusation in 71 (73%); false/misleading forensic evidence in 39 (40%). 78% of 2025 exonerees were people of color (61% Black); average 14.2 years lost per exoneree (1,373 years total); total compensation paid to exonerees since 1989 now exceeds $5.5 billion. Useful for citing a specific dated year's figures (and year-over-year trend) rather than the live cumulative counter.",
    status: "verified",
    issueTags: ["Wrongful conviction research", "Compensation"],
  },
  {
    title: "Explore the Numbers: Innocence Project's Impact",
    sourceKind: "innocence_organization",
    authorityTier: 4,
    jurisdiction: null,
    citation: null,
    organization: "Innocence Project",
    publicationDate: "2026-04-14",
    url: "https://innocenceproject.org/exonerations-data/",
    summary:
      "As of April 14, 2026: 257 total Innocence Project client exonerations (205 DNA), 4,102 collective years of wrongful incarceration, average 16 years served. Contributing factors among these 257 cases: eyewitness misidentification 62%, misapplied forensic science 52%, false confessions 29%, unreliable informants 19% (not mutually exclusive). The actual perpetrator was identified in 89 of 257 cases; those perpetrators went on to commit 101 additional violent crimes while the wrong person was imprisoned. ~81 IP exonerees remain uncompensated; 14 states still have no wrongful-conviction compensation statute. This is IP's own client caseload, methodologically distinct from the NRE's national database — note that distinction whenever both are cited together.",
    status: "verified",
    issueTags: ["Wrongful conviction research", "Compensation"],
  },
  {
    title: "Estimating the Prevalence of Wrongful Convictions",
    sourceKind: "government_publication",
    authorityTier: 2,
    jurisdiction: "federal",
    citation: "NCJ 251115",
    organization: "National Institute of Justice (research by the Urban Institute)",
    publicationDate: "2017-09-01",
    url: "https://nij.ojp.gov/library/publications/estimating-prevalence-wrongful-convictions",
    summary:
      "NIJ-funded Urban Institute study re-examining 714 murder/sexual-assault convictions from the 1970s-80s across 56 Virginia circuit courts, applying post-conviction DNA testing and case-document review. Finding: among cases where physical evidence produced a DNA profile of known origin, 12.6% supported a wrongful-conviction claim; extrapolated across the full dataset, an estimated overall wrongful-conviction rate of 11.6%. One of very few empirically-grounded (not registry-count-based) wrongful-conviction rate estimates. Scope limitation: applies specifically to pre-DNA-era Virginia murder/sexual-assault convictions, not the criminal justice system generally — that limitation should always accompany the figure.",
    status: "verified",
    issueTags: ["Wrongful conviction research"],
  },
  {
    title: "28 U.S.C. § 2513 — Unjust Conviction and Imprisonment",
    sourceKind: "statute",
    authorityTier: 1,
    jurisdiction: "federal",
    citation: "28 U.S.C. § 2513",
    organization: "United States Congress",
    publicationDate: "2004-01-01",
    url: "https://www.law.cornell.edu/uscode/text/28/2513",
    summary:
      "The federal wrongful-conviction compensation statute: lets a person convicted of a federal offense sue in the U.S. Court of Federal Claims once their conviction is reversed/vacated on innocence grounds (or they receive an innocence-based pardon), requiring proof by certificate of the court that the conviction was set aside on innocence grounds and that they did not commit the charged acts. Damages capped at $50,000 per 12-month period of unjust imprisonment ($100,000 under a death sentence); the cap was just $5,000 before a 2004 amendment. Applies only to federal convictions — state wrongful convictions are governed by separate state statutes, and roughly 14 states have none at all.",
    status: "verified",
    issueTags: ["Wrongful conviction research", "Compensation"],
  },
  {
    title: "Rate of False Conviction of Criminal Defendants Who Are Sentenced to Death",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "PNAS 111(20), 7230-7235 (2014); DOI 10.1073/pnas.1306417111",
    organization: "Gross, O'Brien, Hu, Kennedy — Proceedings of the National Academy of Sciences",
    publicationDate: "2014-01-01",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4034186/",
    summary:
      "Peer-reviewed survival-analysis study of 7,482 U.S. death sentences imposed 1973-2004, concluding \"at least 4.1%\" of death-sentenced defendants would eventually be exonerated if all remained under sentence of death indefinitely — explicitly a conservative lower-bound estimate for death-sentenced defendants specifically, not a general wrongful-conviction rate. Also finds defendants resentenced to life have roughly one-eighth the exoneration rate of those remaining condemned, attributed to reduced scrutiny once execution isn't imminent — relevant to arguments about case-attention/resource allocation.",
    status: "verified",
    issueTags: ["Wrongful conviction research"],
  },
  {
    title: "Obstacles and Barriers After Exoneration",
    sourceKind: "academic_research",
    authorityTier: 3,
    jurisdiction: null,
    citation: "83 Alb. L. Rev. 829 (2020)",
    organization: "Goldberg, Guillen, Hernandez, Levett — Albany Law Review",
    publicationDate: "2020-01-01",
    url: "https://www.albanylawreview.org/api/v1/articles/70149-obstacles-and-barriers-after-exoneration.pdf",
    summary:
      "Peer-reviewed survey of obstacles exonerees face after release across three areas: compensation, mental health, and reentry. Documents that not all states have wrongful-conviction compensation statutes, and existing ones are frequently insufficient and difficult to obtain; reviews mental-health sequelae of wrongful incarceration and resulting reentry barriers; proposes policy solutions in each area. Complements NRE/Innocence Project raw statistics with legal-scholarship analysis of why the compensation/reentry system falls short.",
    status: "verified",
    issueTags: ["Wrongful conviction research", "Compensation", "Reentry and record relief"],
  },
];

/** Inserts every row in KNOWLEDGE_SOURCE_SEED_DATA plus its issue-tag links
 * (and a case link for rows with relatedCaseClientName), returning how many
 * source rows were created. Not safe to call twice against the same
 * database — mirrors seedResources()'s convention. */
export async function seedKnowledgeSources(): Promise<number> {
  const now = new Date();
  let created = 0;
  for (const item of KNOWLEDGE_SOURCE_SEED_DATA) {
    const [row] = await db
      .insert(knowledgeSources)
      .values({
        title: item.title,
        sourceKind: item.sourceKind,
        authorityTier: item.authorityTier,
        jurisdiction: item.jurisdiction ?? null,
        citation: item.citation ?? null,
        organization: item.organization ?? null,
        summary: item.summary,
        url: item.url ?? null,
        publicationDate: item.publicationDate ? new Date(item.publicationDate) : null,
        lastVerifiedAt: now,
        verifiedBy: "Xonorate Editorial / Research (AI-assisted, web-verified)",
        status: item.status,
      })
      .returning({ id: knowledgeSources.id });

    if (item.issueTags.length > 0) {
      await db
        .insert(knowledgeSourceIssueLinks)
        .values(item.issueTags.map((issueTag) => ({ sourceId: row.id, issueTag })));
    }

    if (item.relatedCaseClientName) {
      const matches = await db
        .select({ id: cases.id })
        .from(cases)
        .where(ilike(cases.clientName, `%${item.relatedCaseClientName}%`))
        .limit(1);
      if (matches[0]) {
        await db.insert(caseKnowledgeSourceLinks).values({ caseId: matches[0].id, sourceId: row.id });
      }
    }

    created++;
  }
  return created;
}
