/**
 * The first Resource Center knowledge-hub batch — 10 priority
 * wrongful-conviction topics, built on the knowledge-hub fields already on
 * `resources` (overview, whyItMatters, howItHappens, whatToKnow,
 * whatToLookFor, questionsToAsk, whatYouCanDo, xonorateFindings,
 * disclaimer, keyFact*, reviewedBy) and wired into the knowledge graph
 * (resourceKnowledgeSourceLinks, resourceCaseLinks, resourceIssueLinks)
 * built for Ask Xonorate — no new fields, no second knowledge system.
 *
 * Every citation referenced here (by exact title) must already exist in
 * KNOWLEDGE_SOURCE_SEED_DATA — this file only links to it, never restates
 * or duplicates its content. Every case link (by client name) is a real,
 * already-tagged Xonorate case (see cases.contributingFactorTags) — a
 * topic with no genuinely matching case or Xonorate reporting gets no
 * case link and no xonorateFindings, rather than an invented one.
 *
 * Shared by scripts/seed-resource-knowledge-hubs.ts (manual local runner)
 * and a one-time production migration route, same convention as
 * resource-seed-data.ts / knowledge-source-seed-data.ts.
 */
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import {
  cases,
  knowledgeSources,
  resourceCaseLinks,
  resourceIssueLinks,
  resourceKnowledgeSourceLinks,
  resources,
} from "@/db/schema";
import { insertWithUniqueSlug } from "@/lib/unique-slug";
import type { WhatYouCanDoItem } from "@/app/resources/[slug]/resource-sections";

type SeedHub = {
  title: string;
  subcategory: string;
  description: string;
  tags: string[];
  issueTags: string[];
  keyFactStat?: string;
  keyFactLabel?: string;
  keyFactSourceTitle?: string;
  overview: string;
  whyItMatters: string;
  howItHappens: string;
  whatToKnow: string;
  whatToLookFor: string;
  questionsToAsk: string[];
  whatYouCanDo: WhatYouCanDoItem[];
  xonorateFindings?: string;
  relatedCaseClientNames?: string[];
  relatedKnowledgeSourceTitles: string[];
};

const COMMON_WHAT_YOU_CAN_DO: WhatYouCanDoItem[] = [
  { label: "Ask Xonorate", description: "Explore this issue interactively, grounded in the sources on this page.", href: "/ask" },
  { label: "Review related Xonorate cases", description: "See how this issue has appeared in documented cases.", href: "/cases" },
  {
    label: "Find qualified legal help",
    description: "The National Association of Criminal Defense Lawyers and your state's innocence organization can help locate qualified counsel.",
    href: "/resources/browse?category=legal",
  },
];

export const RESOURCE_KNOWLEDGE_HUB_SEED_DATA: SeedHub[] = [
  {
    title: "Eyewitness Identification",
    subcategory: "Eyewitness Identification",
    description:
      "Why confident eyewitness testimony is one of the most common — and most fixable — causes of wrongful conviction.",
    tags: ["eyewitness identification", "lineup", "photo array", "show-up", "mistaken identification"],
    issueTags: ["Mistaken witness identification"],
    keyFactStat: "27.16%",
    keyFactLabel: "of exonerations in the National Registry of Exonerations involve a mistaken witness identification.",
    keyFactSourceTitle: "Exonerations by Contributing Factor",
    overview: `An eyewitness identification is when a witness or victim identifies a person as the perpetrator of a crime — through a live lineup, a photo array, a "show-up" (a single suspect presented shortly after a crime), or an in-court identification.

Human memory is not a recording. It is reconstructed each time it is recalled, and that reconstruction can be shaped by stress, suggestion, the passage of time, and the way an identification procedure is conducted. An eyewitness can be completely honest, entirely confident, and still be wrong.`,
    whyItMatters: `Eyewitness misidentification is the single most common contributing factor documented across U.S. exonerations — present in roughly a quarter to two-thirds of wrongful convictions, depending on the dataset (27% of all National Registry of Exonerations cases; 69% of the Innocence Project's DNA-exoneration cases specifically, where identification evidence is more central to the underlying crimes).

It matters because identification evidence is unusually persuasive to jurors — a witness pointing at a defendant and saying "that's him" can outweigh weaker physical evidence, even when the identification procedure itself was flawed. And because the error happens in a witness's own mind, it is often invisible: the witness is not lying, so cross-examination alone may not expose the problem.`,
    howItHappens: `Identification errors have both "system variables" (things police control) and "estimator variables" (things about the crime and the witness that no one controls):

**System variables — how the identification is conducted:**
- **Lineup or array composition.** If the suspect is the only person who resembles the witness's description, or stands out in clothing, lighting, or photo quality, the procedure itself points to them.
- **Administrator influence.** An officer who knows who the suspect is can — even unintentionally — signal the "right" answer through tone, body language, or follow-up questions. Double-blind administration (where the administering officer doesn't know who the suspect is) removes this risk.
- **Instructions.** If a witness isn't told the perpetrator "may or may not" be in the lineup, they may assume they must pick someone.
- **Feedback.** Confirming feedback ("good, that's who we thought it was") after a choice can inflate a witness's certainty at trial, even when their certainty at the time of the identification was low.
- **Sequential vs. simultaneous presentation.** Viewing photos one at a time (sequential) rather than all at once (simultaneous) is associated with fewer mistaken identifications in some research, though this remains an area of ongoing study.

**Estimator variables — the conditions of the original event:**
- Stress, the presence of a weapon ("weapon focus"), poor lighting, distance, and duration of the encounter all degrade memory encoding.
- **Cross-racial identification** — a witness identifying someone of a different race — is associated with a measurably higher error rate than same-race identification, a well-replicated finding in the psychological research (see Research & Data below).
- Time between the crime and the identification matters: memory degrades, and post-event information (media coverage, conversations with others) can contaminate it.`,
    whatToKnow: `**Confidence is not the same as accuracy.** A witness who says "I'm 100% certain" at trial may have said "I think that might be him" at the actual lineup. Courts and researchers increasingly focus on confidence *at the time of the identification*, not confidence months or years later at trial — because confidence can grow after the fact, especially with confirming feedback.

**The "totality of the circumstances" test.** Under the federal constitutional standard (*Manson v. Brathwaite*, building on *Neil v. Biggers*), a court asks first whether an identification procedure was unnecessarily suggestive, and if so, whether the identification is nonetheless reliable based on factors like the witness's opportunity to view the perpetrator, their degree of attention, the accuracy of their prior description, their certainty, and the time elapsed. This test applies nationwide, though some states — most notably New Jersey after *State v. Henderson* — have adopted more protective state-law standards informed by current memory science.

**Not all suggestion is treated the same.** Under *Perry v. New Hampshire*, the constitutional reliability check described above applies only when police *arranged* the suggestive circumstances — not when suggestion happens by chance (e.g., a witness spontaneously recognizing someone). That means many identification-reliability problems get no special pretrial screening at all and must be challenged through cross-examination and expert testimony instead.

**Reform is uneven.** Practices like double-blind administration, sequential presentation, and recorded confidence statements are recommended by the U.S. Department of Justice and supported by decades of research, but they are not mandatory everywhere — practice still varies significantly by state and even by department.`,
    whatToLookFor: `When examining a case involving an eyewitness identification, documented patterns worth examining include:

- **How the procedure was conducted** — a single photo or show-up rather than a full array of comparable fillers is a documented risk factor.
- **Whether the person identified stood out** from the other people/photos in the array in a way that matched the witness's description (clothing, a distinguishing feature).
- **Who administered the procedure** and whether they knew which person was the suspect.
- **What the witness said at the time** — their exact words and stated confidence level, compared to their trial testimony.
- **The witness's description before any identification** — how closely it actually matched the person identified.
- **Viewing conditions** — lighting, distance, duration, and any obstruction at the time of the crime.
- **Whether a cross-racial identification was involved.**
- **How much time passed** between the crime and the identification, and whether the witness saw the suspect's photo or image more than once (in a photo array, a media report, a social-media post) before making a formal identification.
- **What else the identification rested on** — many documented wrongful convictions involving misidentification also involved other unreliable evidence (informants, forensic evidence).

These are documented factors that researchers, courts, and advocates have found worth examining — not proof that any specific identification was wrong or unconstitutional.`,
    questionsToAsk: [
      "What was the exact identification procedure — a single photo, a photo array, a live lineup, a show-up, or only an in-court identification?",
      "If an array or lineup was used, how many fillers were included, and did the person identified stand out in any way?",
      "Did the administering officer know who the suspect was, and was the procedure double-blind?",
      "What did the witness say — in their own words — at the moment of the identification, and how certain did they say they were then, compared to at trial?",
      "What was the witness's description of the perpetrator before any identification was made, and how well does it match the person identified?",
      "What were the actual viewing conditions during the crime — lighting, distance, duration, obstruction, and whether a weapon was present?",
      "Was this a cross-racial identification?",
      "How much time passed between the crime and the identification, and was the witness exposed to the suspect's image more than once beforehand?",
      "Was the identification procedure documented or recorded, and do the original photo array and administrator notes still exist?",
      "What else corroborated the identification, and has any of that corroboration since been undermined or recanted?",
    ],
    whatYouCanDo: [
      ...COMMON_WHAT_YOU_CAN_DO,
      { label: "Learn about identification reform", description: "See what double-blind and sequential procedures are and why they're recommended.", href: "/resources/browse?tags=eyewitness+identification" },
    ],
    xonorateFindings:
      "Xonorate has documented eyewitness identification problems in several of its cases. In *Anthony Ways*, records indicate the identifying witness was near-sighted and not wearing his glasses at the time of a nighttime encounter, and the person he later identified was the only individual in the photo lineup wearing a hat matching the witness's description of the perpetrator. In *Taron Hill*, the case against him rested in significant part on a single-photo identification rather than a full array. In *Anthony Ray Hinton*, identification and forensic evidence were part of a broader case Xonorate has documented alongside inadequate legal defense. These are documented patterns in Xonorate's own case files, not a statement that any legal standard was violated.",
    relatedCaseClientNames: ["Anthony Ways", "Taron Hill", "Anthony Ray Hinton"],
    relatedKnowledgeSourceTitles: [
      "Neil v. Biggers",
      "Manson v. Brathwaite",
      "Perry v. New Hampshire",
      "State v. Henderson",
      "Eyewitness Evidence: A Guide for Law Enforcement",
      "Thirty Years of Investigating the Own-Race Bias in Memory for Faces: A Meta-Analytic Review",
      "How Eyewitness Misidentification Can Send Innocent People to Prison",
      "Understanding the Registry — Mistaken Witness Identification",
    ],
  },

  {
    title: "False Confessions",
    subcategory: "False Confessions",
    description: "How and why innocent people sometimes confess to crimes they did not commit.",
    tags: ["false confession", "interrogation", "miranda", "coercion", "juvenile interrogation"],
    issueTags: ["False confession"],
    keyFactStat: "12.67%",
    keyFactLabel: "of exonerations in the National Registry of Exonerations involve a false confession.",
    keyFactSourceTitle: "Exonerations by Contributing Factor",
    overview: `A false confession is a confession to a crime the person did not actually commit. It can happen through explicit coercion, or through psychological pressure that never rises to the level courts would call "coercive" but still produces a false admission.

Confessions are among the most persuasive evidence a jury can hear — most people assume no one would ever admit to something they didn't do. But decades of psychology research, and hundreds of documented exoneration cases involving a confession later proven false, show that assumption does not always hold.`,
    whyItMatters: `False confessions are documented in roughly 12–29% of wrongful convictions, depending on the dataset (12.67% across the full National Registry of Exonerations; 29% of Innocence Project DNA exonerations, where confession evidence played an outsized role in the original convictions). They are especially concentrated among certain groups — juveniles, people with intellectual disabilities, and people in psychologically vulnerable states — who research shows are disproportionately susceptible to suggestive or high-pressure interrogation tactics.

Confession evidence is powerful precisely because it seems to answer the case on its own. A false confession can end an investigation into other leads, and it can be extraordinarily difficult to walk back once given — juries tend to credit a confession even when the surrounding circumstances (a coerced setting, a vulnerable suspect, factual inconsistencies) suggest it shouldn't be trusted.`,
    howItHappens: `Modern interrogation training (in the tradition of the widely taught Reid technique and its descendants) uses accusatorial, confrontational methods designed to move a suspect from denial to admission. Research on false confessions, most prominently by psychologist Saul Kassin and colleagues, identifies several recurring mechanisms:

- **Isolation and length.** Prolonged interrogation — sometimes many hours — in an isolated setting increases psychological pressure and fatigue.
- **Presentation of false evidence.** Investigators in the U.S. are generally permitted to lie about the evidence they have (falsely claiming a codefendant confessed, or that physical evidence implicates the suspect), which can convince an innocent person that denial is futile.
- **Minimization.** Suggesting a lesser, more sympathetic version of events ("this sounds like it was self-defense") can imply leniency and make confessing feel like the rational choice, even for someone innocent.
- **Youth and vulnerability.** Juveniles and people with intellectual disabilities are more likely to be compliant with authority, to not fully understand their rights, and to prioritize ending an uncomfortable interrogation over its long-term consequences.
- **Internalization.** In rarer cases, sustained pressure combined with genuine confusion or suggestibility can lead a suspect to actually come to doubt their own memory and believe they may have committed the crime.

Researchers distinguish **voluntary** false confessions (given without significant external pressure, sometimes to protect someone else or for other reasons), **compliant** false confessions (the suspect knows they're innocent but confesses to escape the interrogation or gain a promised benefit), and **internalized** false confessions (the suspect comes to believe, often temporarily, that they actually did it).`,
    whatToKnow: `**Miranda governs disclosure and waiver, not truthfulness.** *Miranda v. Arizona* requires that suspects be warned of their rights and that police show a valid waiver before using a custodial statement — but Miranda says nothing about whether a properly-warned, validly-waived confession is actually true or voluntary. A confession can clear the Miranda bar and still be false.

**Voluntariness requires police coercion — not just vulnerability.** Under *Colorado v. Connelly*, a confession is not constitutionally "involuntary" based on a suspect's own mental state alone; there must be coercive police conduct. This means a confession from someone with a serious mental illness or intellectual disability, absent provable police coercion, may not be excluded on due-process grounds alone — a significant limitation that has pushed reform efforts toward other safeguards, like mandatory recording.

**Recording is a growing safeguard, not yet universal.** States including Alaska (*Stephan v. State*) and Wisconsin (for juveniles, *In re Jerrell C.J.*) have required electronic recording of custodial interrogations as a matter of state constitutional or supervisory authority. The U.S. Department of Justice adopted a presumption of recording for federal law enforcement agencies in 2014. But there is no universal federal requirement, and practice still varies by state and department.

**Deception about evidence is generally legal.** Investigators are typically permitted to falsely tell a suspect that evidence implicates them (a fingerprint, a witness, a codefendant's statement) — a tactic research links to false confessions, but one that remains a lawful interrogation technique in most jurisdictions.`,
    whatToLookFor: `Documented factors that researchers and advocates say are worth examining in a case involving a confession:

- **Was the interrogation recorded in full**, including the period before formal questioning began? A recording of only the final, clean confession — with hours of unrecorded pre-interrogation conversation — is a documented pattern of concern.
- **How long did the interrogation last**, and under what conditions (isolation, lack of sleep, lack of food or breaks)?
- **Was false evidence presented to the suspect** during questioning, and can that be confirmed against the actual evidence in the case?
- **Did the interrogation involve minimization tactics** that implied a lesser consequence for admitting involvement?
- **Was the suspect a juvenile, or does the record suggest an intellectual disability, mental illness, or language barrier?**
- **Does the confession match the actual facts of the crime**, including details that were not publicly known (a discrepancy between a confession and the physical evidence is a documented red flag) — or does it read as though the suspect was fed those details during questioning?
- **Was counsel present, or was the right to counsel invoked and questioning continued anyway?**
- **Were there multiple interrogation sessions**, and did the account change meaningfully between them?

These are examination points, not proof that any specific confession was false or unlawfully obtained.`,
    questionsToAsk: [
      "Was the interrogation recorded in its entirety, including any pre-interrogation conversation?",
      "How long did the interrogation last, and what were the physical conditions (isolation, breaks, sleep, food)?",
      "Was the suspect told false information about the evidence against them during questioning?",
      "Did the interrogation involve minimization — suggesting a lesser or more sympathetic version of events?",
      "Was the suspect a juvenile, or is there evidence of an intellectual disability, mental illness, or language barrier?",
      "Does the confession contain details that were not publicly known, and if so, could those details have come from the interrogators rather than the suspect's own knowledge?",
      "Does the confession match the physical evidence and timeline of the crime?",
      "Did the suspect invoke the right to remain silent or to counsel, and did questioning continue afterward?",
      "Were there multiple interrogation sessions, and how did the account change between them?",
      "What does the jurisdiction's law require for the admissibility of a confession — is recording required, and was that requirement followed?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    relatedKnowledgeSourceTitles: [
      "Miranda v. Arizona",
      "Colorado v. Connelly",
      "Stephan v. State",
      "In re Jerrell C.J.",
      "DOJ Policy on Electronic Recording of Statements",
      "The Psychology of Confessions: A Review of the Literature and Issues",
      "False Confessions — National Registry of Exonerations",
      "False Confessions — Innocence Project",
    ],
  },

  {
    title: "Jailhouse Informants",
    subcategory: "Jailhouse Informants",
    description: "Why testimony from incentivized informants is one of the most unreliable — and least scrutinized — forms of evidence.",
    tags: ["jailhouse informant", "incentivized witness", "informant testimony", "snitch testimony"],
    issueTags: ["Jailhouse informants"],
    keyFactStat: "~7%",
    keyFactLabel: "of exonerees in the National Registry of Exonerations were convicted in cases involving jailhouse-informant testimony — rising to roughly 15% of murder exonerations specifically.",
    keyFactSourceTitle: "Jailhouse Informants — National Registry of Exonerations",
    overview: `A jailhouse informant is a person who was incarcerated alongside a defendant and later testifies that the defendant confessed to them, or made other incriminating statements, while both were in custody. Informants sometimes testify in exchange for reduced charges, a more lenient sentence, money, or other benefits — creating a direct incentive to provide testimony that helps the prosecution's case, whether or not it is accurate.

This is distinct from an eyewitness or a victim: an informant typically has no independent connection to the underlying crime and offers only secondhand testimony about what the defendant allegedly said.`,
    whyItMatters: `Jailhouse informant testimony has been documented in a meaningful share of wrongful convictions, and it is heavily concentrated in the most serious cases — particularly homicides, where the stakes (and the incentives offered to informants) are highest. Because an informant is often the only person who can testify to an alleged confession, their credibility can carry enormous weight, even though the very incentive structure that produces their testimony creates a strong motive to fabricate or exaggerate.

Unlike DNA or fingerprint evidence, informant testimony is not physical evidence that can later be re-tested. If it was false, the primary way to discover that is through disclosure of the informant's incentives, corroboration requirements, or the informant's own later recantation — all of which depend on legal and institutional safeguards that vary significantly by jurisdiction.`,
    howItHappens: `Several documented dynamics make jailhouse informant testimony especially prone to error:

- **Direct incentive to fabricate.** An informant facing their own charges has a strong motive to provide testimony prosecutors want to hear, whether from a plea deal, a sentence reduction, or simply the hope of favor.
- **Access to non-public details.** An informant housed near a defendant, or who has reviewed charging documents, media coverage, or conversations with other inmates, may pick up accurate-sounding details about a crime without the defendant ever having confessed anything — making a fabricated account sound credible.
- **Denial of the deal.** Peer-reviewed research analyzing confirmed false-informant-testimony cases found that a large majority of informants denied receiving any benefit in exchange for testimony, despite having one — meaning juries were frequently misled about the very incentive that should have informed their assessment of credibility.
- **Underdisclosure.** Under *Napue v. Illinois* and *Giglio v. United States*, prosecutors are constitutionally required to disclose informant benefits and correct known false testimony about them — but whether that disclosure duty is actually met in a given case is not always verifiable from the trial record alone.
- **Recantation, often too late.** Peer-reviewed analysis of DNA exoneration cases involving informants found that roughly a quarter of those informants later recanted their testimony — frequently well after the conviction was already final.`,
    whatToKnow: `**The constitutional floor is disclosure, not corroboration.** *Napue* and *Giglio* require prosecutors to disclose any deal or benefit offered to an informant and to correct known false denials of such deals — but neither case requires that informant testimony be corroborated by independent evidence before a jury can rely on it. Whether independent corroboration is required at all depends on state law.

**A small number of states require corroboration.** Illinois, Texas, and California are among the states that have gone further than the federal constitutional floor, adopting statutes that require pretrial reliability screening (Illinois, for certain serious offenses), independent corroboration before conviction (Texas, California), and — in California — a mandatory cautionary jury instruction and pretrial written disclosure of any benefits. These reforms were generally adopted in direct response to documented informant-related scandals in those states, not as a nationwide baseline.

**No comprehensive statewide informant-tracking database currently exists** in most states, including California, where a 2017–2018 bill that would have created one did not pass. Where an informant has testified in multiple cases, and with what result, is often difficult to verify from the outside.

**Corroborating details can be misleading.** Peer-reviewed research on confirmed false-informant-testimony cases found that even when an informant's account of "peripheral" crime details was partly accurate, the core, fabricated claim (that the defendant confessed) could still deceive a jury — a documented pattern researchers describe using "truth-default" theory, where accurate surrounding details lend false credibility to an inaccurate central claim.`,
    whatToLookFor: `Documented factors worth examining when a case involves jailhouse informant testimony:

- **What benefit, if any, did the informant receive or expect** — reduced charges, a lighter sentence, money, or other consideration — and was that benefit disclosed to the defense and the jury?
- **Did the informant deny receiving any benefit**, and can that denial be checked against the informant's own case file or plea agreement?
- **Has this informant testified in other cases**, and what happened in those cases?
- **Could the informant have learned the details in their account** from charging documents, media coverage, shared housing, or conversations with others, rather than from the defendant?
- **Was the informant's account corroborated by independent evidence**, or did the case rest substantially on their testimony alone?
- **Did the informant's account change over time**, or is there a record of them recanting?
- **Was a pretrial reliability hearing available or required** in the relevant jurisdiction, and was one held?

These are documented risk factors researchers and advocates say are worth examining — not proof that any specific informant's testimony was false.`,
    questionsToAsk: [
      "What benefit, if any, did the informant receive or expect in exchange for testifying, and was it disclosed to the defense?",
      "Did the informant deny receiving a benefit, and does that denial match the informant's actual plea agreement or case file?",
      "Has this same informant testified in other cases, and is that history available?",
      "Could the informant have learned the details in their testimony from a source other than the defendant — charging documents, media coverage, shared housing?",
      "Was the informant's testimony corroborated by independent evidence, or was it the primary evidence supporting conviction?",
      "Did the informant's account change across multiple statements or over time?",
      "Is there any indication the informant has since recanted?",
      "Does the relevant jurisdiction require a pretrial reliability hearing, a corroboration requirement, or a cautionary jury instruction for informant testimony — and were those followed here?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented jailhouse informant testimony in its own case files. In *Taron Hill*, records indicate the case involved two jailhouse informants who later recanted their testimony, alongside a single-photo eyewitness identification, with no forensic evidence and no recovered weapon. New Jersey's Conviction Review Unit found clear and convincing evidence that Hill should not have been convicted.",
    relatedCaseClientNames: ["Taron Hill"],
    relatedKnowledgeSourceTitles: [
      "Napue v. Illinois",
      "Giglio v. United States",
      "725 Illinois Compiled Statutes 5/115-21 (Informant Testimony)",
      "Texas Code of Criminal Procedure Article 38.075 (Corroboration of Certain Testimony Required)",
      "California Penal Code §§ 1111.5 and 1127a (In-Custody Informant Corroboration, Jury Instruction, Disclosure)",
      "The Truth About Snitches: An Archival Analysis of Informant Testimony",
      "Sometimes the Snitch Recants: A Closer Look at the Use of Jailhouse Informants in DNA Exoneration Cases",
      "Jailhouse Informants — National Registry of Exonerations",
    ],
  },

  {
    title: "Brady Violations & Prosecutorial Disclosure",
    subcategory: "Brady / Disclosure",
    description: "What prosecutors are constitutionally required to turn over to the defense — and how withheld evidence contributes to wrongful convictions.",
    tags: ["brady violation", "disclosure", "exculpatory evidence", "giglio", "prosecutorial misconduct"],
    issueTags: ["Official misconduct"],
    keyFactStat: "44%",
    keyFactLabel: "of official-misconduct wrongful convictions studied by the National Registry of Exonerations involved concealing exculpatory evidence — the single most common form of documented misconduct.",
    keyFactSourceTitle: "Government Misconduct and Convicting the Innocent: The Role of Prosecutors, Police and Other Law Enforcement",
    overview: `"Brady" is shorthand for the body of constitutional criminal-procedure law — originating in *Brady v. Maryland* (1963) — that requires prosecutors to disclose evidence favorable to the defense when that evidence is material to guilt or punishment. A "Brady violation" or "Brady claim" refers to an allegation that the prosecution failed to meet that obligation.

The duty covers both evidence that is directly exculpatory (suggesting innocence) and evidence that impeaches a prosecution witness's credibility (sometimes called "Giglio material," after *Giglio v. United States*) — for example, an undisclosed deal offered to a cooperating witness.`,
    whyItMatters: `Official misconduct — which includes Brady violations alongside other forms of prosecutorial and police wrongdoing — is documented in a majority of wrongful convictions studied by the National Registry of Exonerations, and concealing exculpatory evidence is the single most common specific form that misconduct takes. Because disclosure violations happen outside the courtroom, in files the defense never sees, they are often invisible at trial and only surface years later — if they surface at all.

Brady's constitutional force is significant precisely because it does not require proof of bad intent: negligent, inadvertent suppression can still violate due process. But that also means Brady problems are frequently discovered only when records are reopened long after a conviction, through post-conviction investigation, a records request, or a later admission.`,
    howItHappens: `Disclosure failures happen in several documented patterns:

- **Evidence held by police never reaches the prosecutor.** Under *Kyles v. Whitley*, a prosecutor's disclosure duty extends to favorable evidence known to police working on the case — even if the individual prosecutor never personally saw it — but that legal duty does not guarantee the evidence actually gets communicated internally.
- **Undisclosed witness benefits.** A deal, a promise of leniency, or payment offered to a cooperating witness or informant is classic Giglio material; failing to disclose it (or allowing a witness to falsely deny it) is a documented and recurring pattern, especially in cases involving jailhouse informants.
- **Ambiguity about what counts as "material."** The constitutional test for whether withheld evidence rises to a violation has been refined across multiple Supreme Court decisions and can be genuinely difficult to apply in real time, which some prosecutors' offices address by disclosing more broadly than the constitutional floor requires (see What To Know) and others do not.
- **No independent audit mechanism.** Unlike a forensic test, disclosure compliance is not routinely verified by anyone outside the prosecutor's own office at the time of trial — problems are typically found only through defense investigation, post-conviction discovery, or a later, unrelated disclosure.`,
    whatToKnow: `**The current legal test has three parts**, most recently summarized in *Strickler v. Greene*: (1) the evidence must be favorable to the accused — exculpatory or impeaching; (2) it must have been suppressed by the state, whether willfully or inadvertently; and (3) prejudice must have resulted, meaning a reasonable probability that disclosure would have changed the outcome. Meeting the first two elements is not enough on its own — the materiality/prejudice element is often the hardest to satisfy, and many claims that meet the first two prongs still fail on the third.

**"Materiality" has a specific legal meaning.** Since *United States v. Bagley*, evidence is material only if there is "a reasonable probability that, had the evidence been disclosed, the result of the proceeding would have been different" — a single standard that applies to both exculpatory and impeachment evidence, and applies regardless of how specifically the defense requested it.

**Good or bad faith does not matter.** Brady's original holding is explicit that the violation exists "irrespective of the good faith or bad faith of the prosecution" — meaning an argument that no one intended to hide anything does not, on its own, resolve a Brady question.

**DOJ's own internal policy goes further than the constitutional minimum.** The Department of Justice's Justice Manual directs federal prosecutors to disclose more broadly than Brady/Giglio strictly require, instructing them to "take a broad view of materiality and err on the side of disclosure" — illustrating the gap between best practice and the bare constitutional floor that governs what a court will actually enforce after the fact.`,
    whatToLookFor: `Documented factors worth examining in a case where a disclosure problem is suspected:

- **What specific evidence is believed to have been withheld**, and how was its existence discovered (a later records request, a co-defendant, a re-investigation)?
- **Who actually possessed the evidence** — the trial prosecutor, another office, a police department, or a crime lab — and is there a record of it ever being communicated to the defense?
- **Was the evidence ever formally requested** by the defense before or during trial?
- **Does the evidence bear on guilt, or does it bear on a witness's credibility** — a deal, a criminal history, a prior inconsistent statement?
- **When did the material surface**, and does the jurisdiction's post-conviction procedure and timing rules allow it to be raised now?
- **What else did the case rest on**, and would the withheld evidence plausibly have changed the outcome — the materiality question that ultimately decides most Brady claims?

These are examination points, not a conclusion that any particular case involved misconduct or a constitutional violation.`,
    questionsToAsk: [
      "What specific item of evidence is believed to have been withheld, and how was its existence discovered?",
      "Who held the evidence — the trial prosecutor's office, another prosecutor's office, a police department, or a lab — and is there a record it reached the defense?",
      "Was the evidence ever formally requested by the defense before or during trial?",
      "Is the evidence exculpatory (bearing on guilt) or impeaching (bearing on a witness's credibility, such as an undisclosed deal)?",
      "When did the material actually surface, and what procedural avenue and deadlines apply to raising it now?",
      "What did the trial record rely on, and would the withheld evidence plausibly have changed the outcome?",
      "Does the jurisdiction's own discovery statute or court rule require disclosure beyond the federal constitutional floor?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented official misconduct, including undisclosed or withheld evidence, in several of its case files. In *Anthony Ways*, the case involved an alternate suspect and questions about what was disclosed to the defense. In *Kennedy Brewer*, records indicate the case involved both misconduct and misleading forensic testimony. Xonorate's reporting treats each documented pattern individually and does not characterize any of these as a proven constitutional violation absent a court's own finding.",
    relatedCaseClientNames: ["Anthony Ways", "Kennedy Brewer", "Dayonte Resiles", "Ricky Jackson"],
    relatedKnowledgeSourceTitles: [
      "Brady v. Maryland",
      "United States v. Bagley",
      "Kyles v. Whitley",
      "Strickler v. Greene",
      "Justice Manual 9-5.001 — Policy Regarding Disclosure of Exculpatory and Impeachment Information",
      "Government Misconduct and Convicting the Innocent: The Role of Prosecutors, Police and Other Law Enforcement",
      "Addressing Official Misconduct: Increasing Accountability in Reducing Wrongful Convictions",
    ],
  },

  {
    title: "Ineffective Assistance of Counsel",
    subcategory: "Ineffective Assistance of Counsel",
    description: "The constitutional standard for inadequate legal defense — and why it is notoriously difficult to satisfy, even for innocent defendants.",
    tags: ["ineffective assistance of counsel", "inadequate defense", "strickland", "sixth amendment"],
    issueTags: ["Inadequate legal defense"],
    keyFactStat: "26%",
    keyFactLabel: "of exonerations in the National Registry of Exonerations involve inadequate legal defense as a documented contributing factor.",
    keyFactSourceTitle: "Inadequate Legal Defense — National Registry of Exonerations",
    overview: `The Sixth Amendment guarantees the right to counsel in a criminal case — and the U.S. Supreme Court has held that this right includes the right to *effective* counsel, not merely the presence of a lawyer. When a defense lawyer's performance falls below a constitutional minimum and that failure affects the outcome, it can amount to a Sixth Amendment violation known as "ineffective assistance of counsel" (often abbreviated IAC).

This is a claim about the adequacy of legal representation — not a claim about the fairness of the prosecution's conduct (that is the separate territory of Brady/official-misconduct claims), and not a general critique of a lawyer's style or strategy.`,
    whyItMatters: `Inadequate legal defense is documented as a contributing factor in roughly a quarter of exonerations, and it interacts with almost every other wrongful-conviction issue on this list: a defense lawyer who fails to investigate an alibi, fails to challenge a suggestive identification, fails to retain a qualified expert to rebut forensic testimony, or fails to interview an informant's history can leave every other problem in a case unaddressed.

It matters because the controlling legal standard — outlined below — is intentionally deferential to defense attorneys' strategic choices, and is often described by researchers and practitioners as very difficult to satisfy in practice, even in cases where a defendant was later proven innocent.`,
    howItHappens: `Ineffective assistance most often traces back to one of a few recurring, well-documented patterns:

- **Failure to investigate.** Not interviewing available witnesses, not pursuing an alibi, or not requesting available forensic testing.
- **Failure to retain or consult an expert.** In *Hinton v. Alabama*, the U.S. Supreme Court found counsel's failure to seek adequate funding for a ballistics expert was not a strategic choice but a basic legal error — counsel mistakenly believed funding was capped by statute when it was not.
- **Failure to challenge weak evidence.** Not objecting to a suggestive identification procedure, not cross-examining an informant's incentives, or not moving to exclude unreliable forensic testimony.
- **Structural, not individual, failure.** Far more common than an attorney's outright misconduct (sleeping through trial, being later disbarred) is a systemic resource gap: overworked public defenders without the investigators, expert funding, time, or training to meaningfully test the prosecution's case.
- **Plea-stage failures.** Ineffective advice during plea bargaining — where the vast majority of criminal cases are actually resolved — can lead a defendant to reject a favorable plea or accept an unfavorable one based on incompetent counsel.`,
    whatToKnow: `**The controlling test has two parts**, from *Strickland v. Washington*: (1) counsel's performance must have been deficient — falling outside "the wide range of reasonable professional assistance" — and (2) that deficiency must have caused prejudice, meaning "a reasonable probability that, but for counsel's unprofessional errors, the result of the proceeding would have been different."

**The standard is intentionally deferential.** *Strickland* directs courts to apply "a strong presumption that counsel's performance was within the wide range of reasonable professional assistance" — meaning a choice not to pursue a particular line of investigation can often be excused as reasonable strategy, even when, in hindsight, it wasn't. Empirical research on DNA exoneration cases has found that courts reject the large majority of IAC claims raised on appeal, even in cases where the defendant was later proven factually innocent.

**Plea-stage ineffectiveness has its own showing.** Under *Lafler v. Cooper*, a defendant claiming ineffective advice caused them to reject a favorable plea must show a reasonable probability they would have accepted the plea, that the court would have approved it, and that the resulting outcome would have been less severe than what actually happened.

**State performance standards exist but don't define the constitutional floor.** States and indigent-defense oversight bodies (for example, North Carolina's Commission on Indigent Defense Services) publish detailed performance guidelines describing what adequate investigation and preparation should look like — but these guidelines typically state explicitly that they are not themselves the legal benchmark for an ineffective-assistance claim, which remains governed by *Strickland*.`,
    whatToLookFor: `Documented factors worth examining in a case where inadequate representation is suspected:

- **What investigation did counsel actually conduct** — were available witnesses interviewed, was an alibi pursued, was available forensic testing requested?
- **Did counsel seek funding for or consult a qualified expert** where the prosecution relied on forensic, scientific, or other expert testimony?
- **Did counsel challenge weak or suggestive evidence** — an identification procedure, an informant's undisclosed incentives, or a forensic method's validity?
- **Was there a failure grounded in a mistake of law** (like the funding-cap error in *Hinton*), rather than a considered strategic choice?
- **What resources did counsel actually have** — was this an overburdened public defender's office, and what does the record show about caseload, time, and access to investigators?
- **If a plea was involved, what advice did counsel give**, and how does it compare to the outcome ultimately received at trial or under a different plea?

These are documented risk patterns — not a conclusion that any specific representation was constitutionally inadequate.`,
    questionsToAsk: [
      "What investigation did trial counsel conduct — were available witnesses interviewed, and was an alibi or exculpatory evidence pursued?",
      "Did counsel seek funding for, or consult, a qualified expert to address the prosecution's forensic or scientific evidence?",
      "Did counsel challenge the reliability of an eyewitness identification, informant testimony, or other weak evidence?",
      "Is there evidence the failure stemmed from a mistake about the law or available resources, rather than a considered strategic decision?",
      "What do the record and available case files show about counsel's caseload, time, and access to investigators or experts?",
      "If a plea was involved, what advice did counsel give, and how does the eventual outcome compare to the plea offer?",
      "Has this claim already been raised and rejected on direct appeal, and what does that mean for raising it now in post-conviction proceedings?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented inadequate legal defense as part of several of its cases. *Anthony Ray Hinton*'s case is a matter of U.S. Supreme Court record — in *Hinton v. Alabama*, the Court unanimously held that trial counsel's failure to seek adequate expert funding was constitutionally deficient performance, and the case was remanded before Hinton was ultimately exonerated. Xonorate's other case files — including *Taron Hill*, *Sean Washington*, and *Kevin Baker* — document inadequate legal defense alongside other contributing factors.",
    relatedCaseClientNames: ["Anthony Ray Hinton", "Taron Hill", "Sean Washington", "Kevin Baker", "Dayonte Resiles"],
    relatedKnowledgeSourceTitles: [
      "Strickland v. Washington",
      "Hinton v. Alabama",
      "Lafler v. Cooper",
      "Performance Guidelines for Indigent Defense Representation in Non-Capital Criminal Cases at the Trial Level",
      "Court Findings of Ineffective Assistance of Counsel Claims in Post-Conviction Appeals Among the First 255 DNA Exoneration Cases",
      "Inadequate Legal Defense — National Registry of Exonerations",
      "Inadequate Defense — Innocence Project",
    ],
  },

  {
    title: "Forensic Evidence Errors",
    subcategory: "Forensic Evidence",
    description: "Why not all \"forensic science\" rests on the same scientific footing — and how discredited or overstated methods have contributed to wrongful convictions.",
    tags: ["forensic evidence", "junk science", "hair analysis", "bite mark", "firearms analysis", "daubert"],
    issueTags: ["False or misleading forensic evidence"],
    keyFactStat: "29.23%",
    keyFactLabel: "of exonerations in the National Registry of Exonerations involve false or misleading forensic evidence.",
    keyFactSourceTitle: "Exonerations by Contributing Factor",
    overview: `"Forensic evidence" is not one thing — it spans everything from DNA analysis, which is grounded in a large, rigorously validated body of statistical science, to pattern-comparison disciplines like bite-mark analysis, hair microscopy, and firearms/toolmark examination, some of which official U.S. government reviews have found were never validated to the same scientific standard, or have since been found unreliable as historically practiced.

Understanding forensic evidence in a wrongful-conviction case requires asking which specific method was used, what the actual scientific basis for that method is, and whether the testimony given at trial accurately reflected the limits of what that method could support — rather than treating "forensic evidence" as uniformly reliable.`,
    whyItMatters: `False or misleading forensic evidence is documented in roughly 29% of exonerations tracked by the National Registry of Exonerations, and in a substantial share of Innocence Project DNA-exoneration cases. It matters because forensic testimony is often presented to juries with an air of scientific certainty — a lab coat, a technical vocabulary, statistics — that can obscure real limitations in the underlying method or overstate the confidence a given technique can actually support.

The problem is not limited to fraud or bad faith. Official U.S. government reviews have found that some forensic disciplines were never built on the kind of rigorous, replicated error-rate research that would justify strong courtroom conclusions — meaning even honest, good-faith testimony in those fields could overstate what the science actually shows.`,
    howItHappens: `Forensic evidence problems documented in wrongful-conviction cases generally fall into a few categories:

- **Methods without a validated scientific foundation.** A landmark 2009 National Academy of Sciences report found that, apart from nuclear DNA analysis, most forensic disciplines — including hair microscopy, bite-mark comparison, and firearms/toolmark analysis — had not been shown through rigorous studies to reliably and consistently link evidence to a specific source.
- **Testimony that overstates certainty.** Even where a method has some scientific basis, an examiner's courtroom testimony can go further than the underlying research supports — asserting a match "to the exclusion of all others" when the actual error rate of the method is unknown or has never been rigorously measured.
- **Discipline-specific findings, not a blanket problem.** Later government reviews have been more granular: the FBI itself found scientifically invalid, overstated hair-microscopy testimony in the vast majority of pre-2000 cases it reviewed; a 2016 White House science-advisory review found DNA analysis and latent fingerprint analysis had adequate scientific foundation while bite-mark comparison did not, and firearms analysis had too few rigorous studies to say either way at the time; a 2023 NIST review focused specifically on bite-mark analysis and found the underlying premises still unsupported by current research.
- **Lack of independent laboratory oversight.** Crime labs historically operating under police or prosecutorial administrative control, without mandatory accreditation or independent standard-setting, is a systemic factor the 2009 National Academy report identified as contributing to the problem.`,
    whatToKnow: `**Federal admissibility turns on scientific reliability, not just relevance.** Under *Daubert v. Merrell Dow Pharmaceuticals*, federal courts require trial judges to act as "gatekeepers," assessing whether proposed expert testimony is scientifically reliable — considering factors like whether the method has been tested, subjected to peer review, has a known error rate, and is generally accepted — before allowing a jury to hear it. Many states have adopted similar standards, though some still use the older *Frye* "general acceptance" test, and application varies significantly by jurisdiction.

**DNA testing access is statutory, not automatic.** The U.S. Supreme Court held in *District Attorney's Office v. Osborne* that there is no freestanding constitutional right to post-conviction DNA testing — access runs instead through specific statutes, including the federal post-conviction DNA testing law (18 U.S.C. § 3600) for federal convictions, and separate state statutes (with differing eligibility rules and deadlines) for state convictions.

**Findings are method-specific, not a blanket statement that "forensics is unreliable."** Government reviews have found single-source DNA analysis and latent fingerprint comparison to have a reasonably established scientific foundation (though even fingerprint analysis has a measurable false-positive rate higher than sometimes claimed in court), while finding bite-mark comparison unsupported by current research and firearms/toolmark analysis under-studied. Treating every forensic discipline as equally reliable — or equally unreliable — misrepresents what the actual government reviews found.

**The FBI itself has publicly acknowledged error.** In a joint review with the Innocence Project and NACDL, the FBI found that historic microscopic hair-comparison testimony given before 2000 contained scientifically invalid, overstated conclusions in the large majority of cases reviewed — a rare direct government admission of a systemic forensic-testimony problem, not merely an outside critique.`,
    whatToLookFor: `Documented factors worth examining when a case involves forensic evidence:

- **Which specific forensic discipline was used** — DNA, hair microscopy, bite marks, firearms/toolmarks, fingerprints, bloodstain pattern analysis — since the scientific basis for these varies significantly.
- **What did the examiner actually say at trial**, and does that testimony match what peer-reviewed research or government reviews say the method can support?
- **Was the method one that later government reviews (National Academy of Sciences 2009, PCAST 2016, NIST reviews) found lacked a validated scientific foundation** as of the time of trial?
- **Is there a documented error history for the specific examiner, lab, or method** — for example, the FBI's own hair-microscopy review?
- **Was newer or more advanced testing available that was not used** at the time, and could it now be pursued through a post-conviction DNA testing statute?
- **Was the forensic conclusion the primary evidence supporting conviction**, or one piece among several independent sources of evidence?
- **Has the underlying evidence been preserved**, and is retesting still possible?

These are documented risk factors — not proof that any specific forensic conclusion was wrong.`,
    questionsToAsk: [
      "Which specific forensic discipline was involved, and what is the current scientific consensus on that method's reliability?",
      "What did the forensic examiner actually say at trial, and does it match what the underlying research supports, or does it overstate certainty?",
      "Has this method been reviewed by a body like the National Academy of Sciences, PCAST, or NIST, and what did that review find?",
      "Is there a documented error history for this specific examiner, laboratory, or method?",
      "Was more advanced or additional forensic testing available at the time of trial that was not performed?",
      "Has the physical evidence been preserved, and would retesting be possible now under a post-conviction DNA testing statute?",
      "Was the forensic conclusion the primary evidence in the case, or one part of a larger body of evidence?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented forensic evidence issues in several of its cases. *Anthony Ray Hinton*'s case involved ballistics/toolmark evidence and a Supreme Court finding that counsel failed to adequately challenge it through a qualified expert. Xonorate's other documented cases — including *Kennedy Brewer*, *Sean Washington*, *Kevin Baker*, and *Dayonte Resiles* — involve false or misleading forensic evidence among their contributing factors.",
    relatedCaseClientNames: ["Anthony Ray Hinton", "Kennedy Brewer", "Sean Washington", "Kevin Baker", "Dayonte Resiles"],
    relatedKnowledgeSourceTitles: [
      "Daubert v. Merrell Dow Pharmaceuticals, Inc.",
      "District Attorney's Office for the Third Judicial District v. Osborne",
      "18 U.S.C. § 3600 — Post-Conviction DNA Testing (Innocence Protection Act of 2004)",
      "Strengthening Forensic Science in the United States: A Path Forward",
      "FBI Testimony on Microscopic Hair Analysis Contained Errors in at Least 90 Percent of Cases in Ongoing Review",
      "Forensic Science in Criminal Courts: Ensuring Scientific Validity of Feature-Comparison Methods (PCAST Report)",
      "Bitemark Analysis: A NIST Scientific Foundation Review",
      "Misapplication of Forensic Science",
    ],
  },

  {
    title: "Newly Discovered Evidence",
    subcategory: "Newly Discovered Evidence",
    description: "How courts treat evidence that surfaces after a conviction — and why \"new\" evidence alone rarely reopens a case.",
    tags: ["newly discovered evidence", "new evidence", "post-conviction dna testing", "recantation"],
    issueTags: ["Newly discovered evidence", "Actual innocence"],
    overview: `"Newly discovered evidence" refers to evidence that was not available, or not known, at the time of a trial — a witness recantation, a new forensic test, a previously unavailable record, or information that surfaces years later. Whether that evidence can actually reopen a closed criminal case is governed by procedural rules that vary significantly by jurisdiction and are generally much narrower than people expect.

This is a distinct legal question from whether the evidence is *persuasive*. A criminal justice system built around finality — the idea that convictions should not remain open to challenge indefinitely — creates real procedural hurdles even for evidence that seems compelling.`,
    whyItMatters: `Newly discovered evidence is the mechanism behind many of the exonerations Xonorate and others document — a recantation, a DNA retest, a previously undisclosed record. But the legal system's structural bias toward finality means that "new evidence exists" is rarely enough on its own; procedural rules about timing, what counts as sufficiently "new," and what forum can even hear the claim, often determine whether that evidence ever gets a court's attention at all.

Understanding these procedural realities matters because acting quickly, and understanding what a given jurisdiction's rules require, can be the difference between evidence that leads somewhere and evidence that arrives too late to matter procedurally, regardless of its substance.`,
    howItHappens: `New evidence surfaces through several recurring paths documented in exoneration cases:

- **Post-conviction DNA testing**, made possible by federal (18 U.S.C. § 3600) and state statutes, sometimes using forensic technology that did not exist or was not sensitive enough at the time of the original trial.
- **Witness recantation** — a witness, informant, or accuser later states that their original testimony was false or mistaken.
- **Records that surface later** — a police report, a lab bench note, or an informant's plea agreement that was never disclosed at trial (see Brady & Disclosure).
- **Advances in scientific understanding** — a forensic method used at trial is later found, through peer-reviewed research or an official review, to be less reliable than presented (see Forensic Evidence).
- **A co-defendant or another suspect's later statement or conviction** that bears on the original case.

Whichever way it surfaces, the evidence then has to be brought into a legal proceeding capable of actually considering it — which is where procedural rules become decisive.`,
    whatToKnow: `**"Newly discovered" doesn't always mean "newly available."** Courts differ — sometimes even within the same state's judicial circuits — on whether evidence must have been genuinely undiscoverable at trial through reasonable diligence ("newly discovered"), or whether it's enough that the evidence is simply being *presented* to the court for the first time now ("newly presented"), regardless of whether it could theoretically have been found earlier. This distinction can determine whether a court will even consider the evidence.

**Federal habeas review is narrow, and "actual innocence" is mainly a gateway, not a standalone claim.** Under *Herrera v. Collins*, the U.S. Supreme Court held that a freestanding claim of actual innocence — unconnected to any other constitutional violation — has never been recognized as its own ground for federal habeas relief, even in a capital case; the Court left open only a hypothetical "extraordinarily high" bar it has never actually granted. Instead, under *Schlup v. Delo* and *McQuiggin v. Perkins*, a sufficiently strong showing of actual innocence functions as a "gateway" — letting a court consider an otherwise procedurally barred or untimely constitutional claim, not as a route to relief on its own.

**The Schlup standard is demanding.** To use the innocence gateway, a petitioner must show it is "more likely than not that no reasonable juror would have convicted him" in light of the new evidence — a standard the Supreme Court itself has described as reserved for a "severely confined category" of cases.

**State procedures differ substantially.** Motions for a new trial based on newly discovered evidence, state post-conviction relief petitions, and state-specific DNA testing statutes each have their own eligibility rules and deadlines — there is no single national procedure, and this resource does not describe any one state's specific rules.`,
    whatToLookFor: `Documented factors worth examining when new evidence has surfaced in a case:

- **What is the evidence, specifically**, and can it be independently verified rather than relying on an account of it?
- **Why wasn't it available at the original trial** — was it genuinely undiscoverable, or does the answer to that question vary depending on which "newly discovered" standard the relevant court applies?
- **What procedural vehicle exists to raise it** — a motion for a new trial, a state post-conviction petition, a federal habeas petition — and what deadlines apply?
- **Is DNA testing possible**, and does the relevant state or federal statute make the defendant eligible for it?
- **If it is a recantation, is it corroborated** by anything beyond the witness's own later statement?
- **Has similar evidence succeeded or failed in comparable cases** in the same jurisdiction, and why?

These are examination points to help identify what avenue may exist — not legal advice about how the law applies to any individual case.`,
    questionsToAsk: [
      "What exactly is the new evidence, and can it be independently verified?",
      "Why was this evidence not available at the original trial, and does that qualify as 'newly discovered' under the applicable jurisdiction's standard?",
      "What procedural vehicle is available to raise it — a motion for new trial, state post-conviction relief, or federal habeas — and what deadlines apply?",
      "If DNA testing is involved, does the relevant state or federal statute make this case eligible, and has the physical evidence been preserved?",
      "If the new evidence is a recantation, is it corroborated by anything beyond the witness's own later statement?",
      "Has comparable evidence succeeded or failed in similar cases in this jurisdiction, and what did the court's reasoning turn on?",
      "Would this evidence, combined with everything else in the case, meet the applicable legal standard for reopening the proceeding?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented cases where newly discovered evidence played a central role in exoneration. In *Taron Hill*, two jailhouse informants who testified against him later recanted. In *Anthony Ray Hinton*, post-conviction retesting of ballistics evidence by qualified experts — after the U.S. Supreme Court found his original counsel's failure to seek expert funding constitutionally deficient — contributed to his eventual exoneration.",
    relatedCaseClientNames: ["Taron Hill", "Anthony Ray Hinton"],
    relatedKnowledgeSourceTitles: [
      "Herrera v. Collins",
      "Schlup v. Delo",
      "McQuiggin v. Perkins",
      "28 U.S.C. § 2254 — Federal Habeas Corpus for State Prisoners",
      "18 U.S.C. § 3600 — Post-Conviction DNA Testing (Innocence Protection Act of 2004)",
      "Not All Evidence is the Same: Habeas Corpus and Actual Innocence",
    ],
  },

  {
    title: "Post-Conviction Relief",
    subcategory: "Post-Conviction Relief",
    description: "How appeals, state post-conviction petitions, and federal habeas corpus differ — and why the distinction matters.",
    tags: ["post-conviction relief", "habeas corpus", "appeal", "conviction review"],
    issueTags: ["Post-conviction relief"],
    overview: `"Post-conviction relief" is an umbrella term for the legal avenues available after a conviction becomes final — distinct from a direct appeal, which challenges legal errors made during the trial itself, based on the existing trial record. Post-conviction proceedings can include state collateral-review petitions, federal habeas corpus, motions for a new trial, and, in some jurisdictions, conviction review by the prosecutor's own office.

Each avenue has different rules about what claims it can hear, what evidence it can consider, and how much time a person has to bring it — making "post-conviction relief" less a single process than a set of distinct, narrower procedures.`,
    whyItMatters: `Nearly every documented exoneration required navigating some form of post-conviction process — because a conviction, once final, is not automatically reopened just because new doubt exists. Understanding which procedure actually applies, and what its specific requirements are, is often the difference between evidence that leads somewhere and evidence that never reaches a court capable of acting on it.

It matters because these procedures are demanding by design: American law places a high value on the finality of criminal judgments, and post-conviction review exists as a deliberately narrower, harder-to-access exception to that finality — not a second trial.`,
    howItHappens: `The most common post-conviction pathways documented in exoneration cases:

- **Direct appeal** — the first, most straightforward review, limited to legal errors that appear in the existing trial record; not itself "post-conviction relief" in the collateral sense, but the step that typically must be exhausted first.
- **State post-conviction (collateral) review** — a separate proceeding, usually in the trial court, that can consider claims outside the trial record (like ineffective assistance of counsel or newly discovered evidence), governed entirely by that state's own statute and procedural rules.
- **Federal habeas corpus** — under 28 U.S.C. § 2254, a federal court can review whether a state conviction violates federal constitutional rights, but only after state remedies have been exhausted, and under a standard that is deferential to the state court's own decision.
- **Executive clemency** — a pardon or commutation from a governor or the President, historically described by courts (including in *Herrera v. Collins*) as the traditional "fail safe" for compelling claims that don't fit neatly into a judicial procedure.
- **Prosecutor-led conviction review** — some prosecutors' offices operate their own conviction integrity or review units that can investigate and, in some cases, move to vacate a conviction outside the traditional appellate process.`,
    whatToKnow: `**Federal habeas review is deferential and procedurally demanding.** Under 28 U.S.C. § 2254, a federal court generally cannot grant relief on a claim already decided by the state courts unless that decision was "contrary to, or involved an unreasonable application of, clearly established federal law" — a high bar. The statute also requires exhausting state remedies first, and sharply limits new evidentiary hearings on claims not already developed in state court.

**Actual innocence mainly functions as a gateway, not a standalone claim.** As described in Newly Discovered Evidence, *Herrera v. Collins* held that a freestanding innocence claim, disconnected from any other constitutional violation, has never been recognized as its own basis for federal habeas relief — a significant and often misunderstood limitation.

**Timing rules are strict and vary by track.** Federal habeas has its own filing deadline under AEDPA, which the actual-innocence gateway can, in a narrow set of circumstances, allow a court to excuse (*McQuiggin v. Perkins*) — but state post-conviction petitions have entirely separate deadlines set by state law, and missing either can foreclose review regardless of the underlying merits.

**"Professional exonerators" now drive most successful outcomes.** Recent National Registry of Exonerations annual reporting has found that the clear majority of exonerations involve dedicated innocence organizations, prosecutor-run conviction integrity units, or both working together — not solely individual habeas litigation — underscoring how much these specialized institutions matter in practice.`,
    whatToLookFor: `Documented factors worth examining when considering post-conviction options:

- **Has direct appeal already been completed**, and what claims were and were not raised on it?
- **What state post-conviction procedure applies**, and what is its filing deadline from the date the conviction became final or the new claim was discovered?
- **Has federal habeas review already been attempted**, since a second or successive federal habeas petition faces additional, stringent restrictions?
- **Does the claim rest on evidence outside the trial record** (making it more suited to collateral review) or purely on the existing record (more suited to direct appeal)?
- **Is there a state or local conviction integrity/review unit** that might independently investigate the case?
- **What does the state's specific post-conviction DNA testing statute require**, if DNA evidence is involved?

These are examination points to help identify what avenues may exist — not a substitute for advice from qualified counsel familiar with the specific jurisdiction.`,
    questionsToAsk: [
      "Has direct appeal already been completed, and what issues were raised and decided?",
      "What is the applicable state post-conviction procedure, and what deadline applies from when the conviction became final or the claim was discovered?",
      "Has federal habeas relief already been sought, and if so, what restrictions apply to filing again?",
      "Does the claim depend on evidence outside the existing trial record, or only on the record as it stands?",
      "Is there a conviction integrity or conviction review unit in the relevant jurisdiction that independently investigates innocence claims?",
      "If DNA evidence is involved, what does the relevant state's post-conviction DNA testing statute require for eligibility?",
      "What deadline risk exists, and has qualified counsel reviewed the timing before any further steps are taken?",
    ],
    whatYouCanDo: [
      ...COMMON_WHAT_YOU_CAN_DO,
      { label: "Learn about state-specific procedures", description: "Post-conviction rules differ by state — a qualified attorney in the relevant jurisdiction can explain what applies.", href: "/resources/browse?category=legal" },
    ],
    xonorateFindings:
      "Xonorate has documented cases that moved through post-conviction review. *Anthony Ray Hinton*'s case reached the U.S. Supreme Court on a post-conviction ineffective-assistance claim, and *Taron Hill*'s conviction was reviewed and found unsupported by New Jersey's Conviction Review Unit — one of the prosecutor-led review mechanisms described above.",
    relatedCaseClientNames: ["Anthony Ray Hinton", "Taron Hill"],
    relatedKnowledgeSourceTitles: [
      "28 U.S.C. § 2254 — Federal Habeas Corpus for State Prisoners",
      "Herrera v. Collins",
      "Schlup v. Delo",
      "McQuiggin v. Perkins",
      "Habeas Corpus (Glossary of Legal Terms)",
      "Not All Evidence is the Same: Habeas Corpus and Actual Innocence",
      "National Registry of Exonerations 2024 Annual Report",
    ],
  },

  {
    title: "Actual Innocence Claims",
    subcategory: "Actual Innocence",
    description: "What it means to raise an actual-innocence claim after conviction, and why the legal system treats innocence as a gateway more often than a standalone remedy.",
    tags: ["actual innocence", "innocence claim", "wrongful conviction", "exoneration procedure"],
    issueTags: ["Actual innocence"],
    keyFactStat: "at least 4.1%",
    keyFactLabel: "is the estimated minimum false-conviction rate among people sentenced to death in the United States, according to a peer-reviewed statistical study — the most rigorous estimate available for any specific category of conviction.",
    keyFactSourceTitle: "Rate of False Conviction of Criminal Defendants Who Are Sentenced to Death",
    overview: `An "actual innocence" claim asserts that a person did not commit the crime they were convicted of — as distinct from claims about *procedural* errors (like an unconstitutional search, an improper jury instruction, or ineffective counsel) that focus on whether the process was fair, regardless of factual guilt.

This distinction matters enormously in practice: American courts have generally treated procedural fairness, not factual innocence itself, as the primary basis for overturning a conviction — a structural reality that shapes almost every legal strategy in a wrongful-conviction case.`,
    whyItMatters: `Every exoneration is, at its core, a vindication of an actual-innocence claim — but the path to that vindication almost always runs through a procedural mechanism (a constitutional violation, a new-evidence rule, a prosecutor's own review), not through a direct, standalone judicial finding of "this person is innocent." Understanding why matters because it shapes what evidence is useful and what legal strategy is realistic.

Empirical research also suggests the scale of the underlying problem is significant: a peer-reviewed statistical study estimated that at least 4.1% of people sentenced to death in the U.S. would eventually be exonerated if all remained under sentence indefinitely — a conservative, methodologically rigorous lower-bound estimate specific to capital cases, not a general wrongful-conviction rate for the criminal justice system as a whole.`,
    howItHappens: `Actual innocence claims proceed through several recognized paths, each with real limits:

- **As a "gateway" through procedural bars in federal habeas** — under *Schlup v. Delo* and *McQuiggin v. Perkins*, a sufficiently strong innocence showing can let a court hear an otherwise procedurally defaulted or untimely constitutional claim, but the innocence claim itself is not the relief; it only unlocks review of another underlying violation.
- **As a freestanding claim — a path the Supreme Court has left largely theoretical.** *Herrera v. Collins* held there is no established freestanding federal habeas right to relief based on actual innocence alone, absent an independent constitutional violation, even in a capital case — and the Court has never actually granted relief under the hypothetical "extraordinarily high" standard it left open.
- **Through state actual-innocence statutes**, which some — not all — states have enacted to create a more direct state-law avenue, with requirements that vary significantly by state.
- **Through post-conviction DNA testing**, which does not itself decide guilt or innocence but can produce evidence used to support an innocence claim through one of the above procedures.
- **Through executive clemency**, which does not require the same evidentiary showing as a court proceeding and has historically served as a "fail-safe" for compelling cases.`,
    whatToKnow: `**Innocence and procedural error are legally distinct.** A court can find a defendant's trial was constitutionally flawed without ever ruling on whether they actually committed the crime, and — as *Herrera* illustrates — a court can decline to grant relief even where genuine doubt about guilt exists, if no cognizable legal claim carries that doubt into a remedy.

**The evidentiary bar for the "gateway" is demanding.** To use actual innocence to unlock review of a barred claim under *Schlup*, a petitioner must show it is "more likely than not that no reasonable juror would have convicted" in light of the new evidence — described by the Supreme Court itself as reserved for "rare" and "extraordinary" cases.

**Freestanding claims remain largely unresolved as a legal matter.** Because *Herrera* left the threshold for a hypothetical freestanding innocence claim undefined and has never been satisfied in practice, most litigators treat federal habeas as a poor forum for a pure innocence claim untethered to another violation — reinforcing why gathering evidence that also supports an independent constitutional claim (ineffective assistance, a Brady violation, a due-process identification problem) is often the more viable strategy.

**DNA and non-DNA exonerations are both common.** Roughly 15% of documented exonerations nationally involve DNA evidence; the substantial majority proceed through other forms of evidence entirely — informant recantations, disclosure of withheld records, expert reassessment of forensic conclusions, and investigative reinvestigation.`,
    whatToLookFor: `Documented factors relevant to evaluating an actual-innocence claim:

- **What evidence affirmatively supports innocence**, as opposed to evidence that merely undermines the prosecution's case — courts and the Schlup standard specifically focus on evidence a reasonable juror would find persuasive of innocence.
- **Is there an independent constitutional claim the innocence evidence could support** — ineffective assistance, a Brady violation, a due-process identification issue — since that combination is generally a stronger procedural path than innocence alone.
- **Does the relevant state have its own actual-innocence statute**, and does the case meet its specific requirements?
- **Is DNA testing available and would it be probative**, given what biological evidence exists and has been preserved?
- **What has already been raised and rejected in prior proceedings**, since that affects what procedural avenue remains open?
- **Is there an active conviction integrity or review unit** in the relevant jurisdiction that could investigate independent of formal litigation?

These are examination points intended to help someone understand what may be possible — not a case-specific legal assessment.`,
    questionsToAsk: [
      "What evidence affirmatively supports innocence, rather than only undermining the prosecution's original case?",
      "Is there an independent constitutional claim — ineffective assistance, a Brady violation, an identification issue — that this evidence could also support?",
      "Does the relevant state have its own actual-innocence statute, and what does it specifically require?",
      "Is DNA testing available, and has the relevant biological evidence been preserved?",
      "What claims have already been raised and rejected in prior appeals or post-conviction proceedings?",
      "Is there an active conviction integrity or conviction review unit in the relevant jurisdiction?",
      "Would executive clemency be a realistic parallel avenue, separate from any court proceeding?",
    ],
    whatYouCanDo: COMMON_WHAT_YOU_CAN_DO,
    xonorateFindings:
      "Xonorate has documented actual-innocence outcomes in several of its cases, including *Anthony Ray Hinton*, *Anthony Ways*, *Taron Hill*, and *Kennedy Brewer* — each ultimately exonerated after evidence and legal proceedings supported their innocence claims through the procedural paths described above, not through a single freestanding declaration of innocence.",
    relatedCaseClientNames: ["Anthony Ray Hinton", "Anthony Ways", "Taron Hill", "Kennedy Brewer"],
    relatedKnowledgeSourceTitles: [
      "Herrera v. Collins",
      "Schlup v. Delo",
      "McQuiggin v. Perkins",
      "DNA Exonerations in the United States (1989-2020)",
      "Rate of False Conviction of Criminal Defendants Who Are Sentenced to Death",
      "Estimating the Prevalence of Wrongful Convictions",
    ],
  },

  {
    title: "Wrongful Conviction Research & Exoneration Data",
    subcategory: "Wrongful Conviction Research",
    description: "What the National Registry of Exonerations and other credible research actually show about how often, and why, wrongful convictions happen.",
    tags: ["wrongful conviction data", "exoneration statistics", "national registry of exonerations", "contributing factors"],
    issueTags: ["Wrongful conviction research"],
    keyFactStat: "3,859",
    keyFactLabel: "documented exonerations are tracked by the National Registry of Exonerations since 1989, totaling more than 36,000 years of wrongful imprisonment.",
    keyFactSourceTitle: "Exonerations by Contributing Factor",
    overview: `The National Registry of Exonerations — a joint project of the University of California Irvine, the University of Michigan Law School, and Michigan State University College of Law — is the most comprehensive, continuously updated database of documented U.S. exonerations, tracking each case's contributing factors, demographics, and outcome. The Innocence Project maintains a separate, related dataset focused specifically on its own client cases (primarily DNA exonerations).

These datasets are the empirical backbone for nearly everything Xonorate and other organizations say about how often, and in what ways, the criminal legal system convicts innocent people — and understanding their scope and limits matters for using their numbers responsibly.`,
    whyItMatters: `Wrongful convictions are, by definition, difficult to count — a case only becomes a documented "exoneration" after a lengthy, uncertain process of discovery, litigation, and formal reversal. That means the tracked numbers are a real but almost certainly incomplete picture: they reflect confirmed, documented cases, not the full universe of wrongful convictions that may never be identified or overturned.

The research also matters because it reveals recurring, structural patterns rather than isolated errors — the same contributing factors (misidentification, informant testimony, forensic error, official misconduct, inadequate defense, false confessions) appear again and again across thousands of cases, which is what makes systemic reform, not just individual case correction, a coherent policy response.`,
    howItHappens: `Credible wrongful-conviction data comes from a small number of rigorous sources, each with a distinct scope:

- **The National Registry of Exonerations** tracks documented exonerations across the full range of crime types, not just those involving DNA, and publishes both a continuously updated live database and dated annual reports.
- **The Innocence Project's own dataset** tracks its client cases specifically — a smaller, DNA-exoneration-heavy population that is not representative of the wrongful-conviction problem as a whole, but offers detailed case-level data on its own cases.
- **Independent academic studies** occasionally attempt to estimate the overall *rate* of wrongful conviction within a defined population — for example, a rigorous 2014 statistical study estimated a minimum 4.1% false-conviction rate among people sentenced to death, and a 2017 NIJ-funded study estimated an 11.6% wrongful-conviction rate specifically among a sample of pre-DNA-era Virginia murder and sexual-assault convictions. Both are important because they attempt to measure a *rate within a defined population*, rather than simply counting known cases — but neither should be generalized beyond the specific population each study actually examined.`,
    whatToKnow: `**Live counters and dated annual reports serve different purposes.** The Registry's live "contributing factor" statistics update continuously as new exonerations are logged, while its annual reports give a fixed, citable snapshot for a specific year — useful for year-over-year trend claims. Any statistic drawn from the live counter should be paired with the date it was pulled, since the numbers shift.

**Documented contributing factors, current as of the most recent pull from the Registry's live data:** perjury or false accusation (64%), official misconduct (61%), false or misleading forensic evidence (29%), mistaken witness identification (27%), and false confession (13%) — cases frequently involve more than one factor, so these figures do not sum to 100%.

**Demographic patterns are well documented.** Recent annual Registry data shows a substantial majority of exonerees are people of color, and Black exonerees are disproportionately represented relative to the general population — a pattern researchers and the Registry itself connect to the disproportionate rate of official misconduct documented in cases involving Black defendants specifically.

**"Professional exonerators" — not just individual litigation — now drive most outcomes.** The Registry's most recent annual reporting found that dedicated innocence organizations and prosecutor-run conviction integrity units, often working together, were involved in the clear majority of a recent year's exonerations.

**Compensation remains uneven.** Federal law (28 U.S.C. § 2513) provides compensation for federal wrongful convictions, capped by statute, but this applies only to federal cases; a substantial number of states have no wrongful-conviction compensation statute at all, and even where compensation exists, research documents significant barriers to actually obtaining it, alongside separate, serious challenges around mental health and reentry after release.`,
    whatToLookFor: `When using or citing wrongful-conviction data, documented practices worth following:

- **Always identify which dataset a statistic comes from** — the full National Registry database, the Innocence Project's own client cases, or an independent academic study — since they measure different, non-interchangeable populations.
- **Pair any live-counter statistic with the date it was pulled**, since the Registry's running figures change as new exonerations are added.
- **Don't generalize a study's rate estimate beyond its actual scope** — a 4.1% capital-case estimate or an 11.6% estimate from a specific Virginia sample should never be quoted as a general wrongful-conviction rate for the criminal justice system as a whole.
- **Remember that documented exonerations are a floor, not a ceiling** — they reflect confirmed, discovered cases, not the full scope of wrongful convictions, many of which likely go undiscovered.
- **Look for corroboration across sources** where possible, since even the best datasets rely on case-by-case researcher classification of "contributing factors," which involves judgment calls.`,
    questionsToAsk: [
      "Which specific dataset does this statistic come from — the full National Registry database, the Innocence Project's client cases, or an independent study?",
      "If it's a live-counter figure, what date was it pulled, and has the underlying database been updated since?",
      "What specific population did the underlying study or dataset actually examine, and does the claim being made stay within that scope?",
      "Does the case or claim in question involve more than one contributing factor, and how are they weighted relative to each other?",
      "What does the same data source say about outcomes — compensation, reentry, mental health — beyond the conviction itself?",
      "Is there corroborating data from more than one credible source?",
    ],
    whatYouCanDo: [
      ...COMMON_WHAT_YOU_CAN_DO,
      { label: "Explore the National Registry of Exonerations", description: "The primary live database behind most of the statistics on this page.", href: "https://exonerationregistry.org" },
    ],
    relatedKnowledgeSourceTitles: [
      "Exonerations by Contributing Factor",
      "National Registry of Exonerations — 2025 Annual Report",
      "Explore the Numbers: Innocence Project's Impact",
      "Estimating the Prevalence of Wrongful Convictions",
      "28 U.S.C. § 2513 — Unjust Conviction and Imprisonment",
      "Rate of False Conviction of Criminal Defendants Who Are Sentenced to Death",
      "Obstacles and Barriers After Exoneration",
    ],
  },
];

async function findKnowledgeSourceId(title: string): Promise<string | null> {
  const rows = await db.select({ id: knowledgeSources.id }).from(knowledgeSources).where(eq(knowledgeSources.title, title)).limit(1);
  return rows[0]?.id ?? null;
}

/** Inserts every row in RESOURCE_KNOWLEDGE_HUB_SEED_DATA plus its issue,
 * case, and knowledge-source links, returning how many resource rows were
 * created. Not safe to call twice against the same database. */
export async function seedResourceKnowledgeHubs(): Promise<number> {
  const now = new Date();
  let created = 0;

  for (const hub of RESOURCE_KNOWLEDGE_HUB_SEED_DATA) {
    const keyFactSourceId = hub.keyFactSourceTitle ? await findKnowledgeSourceId(hub.keyFactSourceTitle) : null;

    const row = await insertWithUniqueSlug(hub.title, (slug) =>
      db
        .insert(resources)
        .values({
          title: hub.title,
          slug,
          category: "knowledge",
          subcategory: hub.subcategory,
          resourceType: "guide",
          audiences: ["general_public", "families", "advocates", "researchers", "journalists"],
          description: hub.description,
          tags: hub.tags,
          keyFactStat: hub.keyFactStat ?? null,
          keyFactLabel: hub.keyFactLabel ?? null,
          keyFactSourceId,
          overview: hub.overview,
          whyItMatters: hub.whyItMatters,
          howItHappens: hub.howItHappens,
          whatToKnow: hub.whatToKnow,
          whatToLookFor: hub.whatToLookFor,
          questionsToAsk: hub.questionsToAsk,
          whatYouCanDo: hub.whatYouCanDo,
          xonorateFindings: hub.xonorateFindings ?? null,
          reviewedBy: "Xonorate Editorial / Research",
          lastReviewedAt: now,
          status: "published",
          publishedAt: now,
        })
        .returning({ id: resources.id }),
    );

    if (hub.issueTags.length > 0) {
      await db.insert(resourceIssueLinks).values(hub.issueTags.map((issueTag) => ({ resourceId: row.id, issueTag })));
    }

    if (hub.relatedCaseClientNames && hub.relatedCaseClientNames.length > 0) {
      for (const clientName of hub.relatedCaseClientNames) {
        const matches = await db.select({ id: cases.id }).from(cases).where(and(ilike(cases.clientName, `%${clientName}%`))).limit(1);
        if (matches[0]) {
          await db.insert(resourceCaseLinks).values({ resourceId: row.id, caseId: matches[0].id });
        }
      }
    }

    for (const sourceTitle of hub.relatedKnowledgeSourceTitles) {
      const sourceId = await findKnowledgeSourceId(sourceTitle);
      if (sourceId) {
        await db.insert(resourceKnowledgeSourceLinks).values({ resourceId: row.id, sourceId });
      }
    }

    created++;
  }

  return created;
}
