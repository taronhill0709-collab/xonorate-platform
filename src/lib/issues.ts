import { slugify } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Deep-content types for the Issues section (2026 expansion). Every field
// below is OPTIONAL on IssueDefinition — issues that haven't been rewritten
// yet just render their existing shallow content (title/dek/explanation/
// stat), and picking up the deeper sections is purely additive, one issue
// at a time, with no changes required anywhere else. The ten other modules
// that import ISSUES (search, sitemap, admin case/source tagging, Ask
// Xonorate's retrieval matching, the resource cross-links) only ever touch
// tag/slug/title, so none of this affects them.
//
// IMPORTANT SOURCING RULE embedded in this shape: a statistic's population/
// dataset is a required field, never optional — see IssueStatistic. That's
// deliberate. Xonorate's own case count must never be used to imply a
// national prevalence rate (see caseNotes below), so every percentage shown
// on an issue page has to carry its own denominator on its face.
// ---------------------------------------------------------------------------

export type IssueStatistic = {
  /** The headline figure, e.g. "62%". */
  value: string;
  sourceLabel: string;
  sourceUrl: string;
  /** The specific dataset, e.g. "Innocence Project DNA exoneration client cases". */
  dataset: string;
  /** Who/what was actually counted — the population the percentage describes. */
  population: string;
  timePeriod: string;
  /** Sample size, when the source states one, e.g. "257 cases". */
  casesAnalyzed?: string;
  /** Plain-language: what the number means, and what it does NOT mean. */
  whatItMeans: string;
};

export type IssueMechanismStep = {
  title: string;
  body: string;
};

export type IssueScenario = {
  incident: string;
  initialInvestigation: string;
  whereProblemBegins: string;
  howInvestigationDevelops: string;
  snowballChain: string[];
  snowballNarrative: string;
  courtroomNarrative: string;
  whatJuryHears: string;
  whatRecordShows: string;
  conviction: string;
  yearsLater: string;
  breakdown: {
    whatHappened: string;
    whyItMattered: string;
    whatShouldHaveBeenExamined: string;
    whatSafeguardCouldHaveHelped: string;
  };
  biggerLesson: string;
};

export type IssueSourceCitation = {
  label: string;
  organization: string;
  url: string;
  note?: string;
};

export type IssueDefinition = {
  /** Matches a value in CONTRIBUTING_FACTOR_TAGS — the source of truth for
   * which cases relate to this issue. */
  tag: string;
  slug: string;
  title: string;
  dek: string;
  /** Serves as the page's "What is it?" section. Kept under its original
   * field name (nothing outside issues/[slug]/page.tsx reads it) but
   * substantially deepened for issues that have the full 2026 rewrite. */
  explanation: string;
  /** The single headline figure shown on the Issues index card — unrelated
   * to (and simpler than) the fully-sourced `statistics` array below, kept
   * only for that one small badge. Only set where a cited national figure
   * actually exists — see national-exoneration-stats.ts for sourcing. */
  stat?: { value: string; label: string };

  // ---- Deep content (added per-issue; undefined until an issue is rewritten) ----
  /** Large-scale, properly-attributed statistics — never derived from
   * Xonorate's own case archive. When more than one credible source
   * reports a different figure, list both; issue-sections.tsx explains why
   * they differ rather than picking the more dramatic one. */
  statistics?: IssueStatistic[];
  /** Override the shared data note in DATA_NOTE_DEFAULT if this issue's
   * sourcing situation needs different wording. */
  dataNote?: string;
  howItHappens?: IssueMechanismStep[];
  whyItMatters?: string;
  /** Short "commonly misunderstood distinction" callouts. */
  distinctions?: string[];
  /** The fictional, labeled-as-fictional illustrative case study. */
  scenario?: IssueScenario;
  /** Per-case-slug grounded text for "how this issue appears in the case" —
   * every sentence here must be traceable to that case's own public page.
   * A real, tagged case with no entry here falls back to its own DB
   * summary rather than inventing case-specific language. */
  caseNotes?: Record<string, string>;
  documentedCasesNote?: string;
  biggerPicture?: string;
  /** Curated, logically-related issues — not auto-generated. */
  relatedIssueSlugs?: string[];
  sources?: IssueSourceCitation[];
};

export const DATA_NOTE_DEFAULT =
  "Wrongful-conviction statistics vary depending on the population studied, the time period examined, and how researchers define and classify contributing factors. Percentages shown here are attributed to their original sources and should not be interpreted as representing all criminal cases, or all wrongful convictions.";

export const DOCUMENTED_CASES_NOTE_DEFAULT =
  "These documented cases are presented as real-world examples of how this issue can appear in an actual case. They are not used to calculate the prevalence statistics above.";

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
 * the National Registry of Exonerations itself codes it (see its own
 * "Official Misconduct" definition, which folds in Brady/withheld-evidence
 * violations). Splitting that into three pages would imply a distinction
 * the data doesn't draw.
 */
export const ISSUES: IssueDefinition[] = [
  {
    tag: "Mistaken witness identification",
    slug: slugify("Mistaken witness identification"),
    title: "Eyewitness misidentification",
    dek: "Confident, and wrong.",
    explanation:
      "An eyewitness identification is testimony that a specific person — not just \"someone\" — committed the crime, based on what a witness says they saw. It feels like the most direct kind of evidence a case can have: someone was there, and they're pointing at the defendant. But human memory doesn't record an event the way a camera does. It's reconstructed, piece by piece, every time it's recalled — which means it can be shaped, without anyone lying or acting in bad faith, by stress, by the questions an investigator asks, by the specific photos placed in front of a witness, and by what a witness is told after they make a choice. \"Eyewitness misidentification\" is the umbrella term researchers use when a witness's identification of the defendant turns out to be wrong, or when the identification procedure itself was compromised enough that the resulting testimony can no longer be trusted as an accurate memory. It doesn't mean the witness set out to deceive anyone. It means the memory — or the process used to extract it — failed.",
    stat: { value: "62%", label: "of Innocence Project client cases" },
    statistics: [
      {
        value: "62%",
        sourceLabel: "Innocence Project",
        sourceUrl: SOURCE_URL,
        dataset: "Innocence Project DNA-exoneration client cases",
        population: "People exonerated by DNA evidence and represented by the Innocence Project",
        timePeriod: "Cumulative total, current as of April 2026",
        casesAnalyzed: "257 cases",
        whatItMeans:
          "This figure comes from one specific, well-documented population: 257 people exonerated by DNA testing whose cases the Innocence Project itself litigated. In 62% of those 257 cases, an eyewitness identification that turned out to be wrong was part of what convicted them. It does not mean 62% of all criminal cases — or even 62% of all wrongful convictions nationally — involve a mistaken identification. DNA-exoneration cases are a specific subset (disproportionately sexual assault and other cases where biological evidence exists to retest), and eyewitness identification plays an outsized role in exactly that kind of case.",
      },
      {
        value: "27%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/exonerations-contributing-factor",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, DNA and non-DNA, all crime types combined",
        timePeriod: "Cumulative since 1989, current registry-wide figure (3,861 exonerations)",
        casesAnalyzed: "3,861 exonerations",
        whatItMeans:
          "The Registry tracks a much larger and broader population than the Innocence Project figure above — every documented exoneration it can find, not only DNA cases, across all crime types. Measured against that full population, mistaken identification is a contributing factor in roughly 27% of cases. The gap between 62% and 27% isn't a contradiction; it's what happens when you change the denominator. DNA cases skew toward crimes (like sexual assault) where a stranger identification is often the central evidence; the full Registry includes far more cases — drug crimes, child sex abuse allegations, homicides solved through informants or confessions — where eyewitness identification plays little or no role at all.",
      },
    ],
    howItHappens: [
      {
        title: "A stressful, often brief encounter",
        body: "Most misidentifications trace back to an encounter that was fast, frightening, and outside the witness's control — a robbery, an assault, a glimpse during a crime in progress. High stress narrows attention and degrades memory formation; witnesses often fixate on a weapon (\"weapon focus\") rather than the perpetrator's face.",
      },
      {
        title: "Limited viewing conditions",
        body: "Poor lighting, distance, a brief window of time, a partially obscured face, or an unfamiliar-race face (cross-racial identifications are measurably less accurate on average) all reduce the amount of reliable information a witness actually encoded in the first place.",
      },
      {
        title: "Memory is reconstructive, not stored",
        body: "Even under ideal conditions, memory isn't retrieved intact — it's rebuilt each time, and it can absorb new information (a photo seen later, a detail mentioned by police, a media report) as if it had always been part of the original memory.",
      },
      {
        title: "The identification procedure itself",
        body: "How a lineup or photo array is built and run matters enormously. A \"filler\" who doesn't resemble the witness's description, a suspect whose photo looks different from the others, or an administrator who knows who the suspect is (and can consciously or unconsciously signal it) all push a witness toward a particular choice.",
      },
      {
        title: "Post-identification feedback",
        body: "What happens after a witness picks someone matters as much as the procedure itself. Confirming feedback — \"good, that's who we thought it was\" — measurably inflates a witness's later-reported confidence, even when their actual memory hasn't changed.",
      },
      {
        title: "Confidence grows, memory doesn't",
        body: "By the time a case reaches trial, months or years later, a witness who was tentative at the moment of identification can become certain — not because their memory improved, but because repetition, feedback, and the process of testifying rehearse and harden the belief.",
      },
      {
        title: "Courtroom testimony",
        body: "A jury typically hears only the confident, final version — a witness pointing at the defendant and stating certainty — with little visibility into how uncertain, suggestible, or procedurally compromised the original identification actually was.",
      },
    ],
    whyItMatters:
      "A mistaken identification doesn't just risk convicting an innocent person — it actively derails the investigation of the actual crime. Once a witness names someone, that person typically becomes the primary suspect: further investigation, forensic testing, and follow-up tend to focus on confirming the theory rather than testing it. That can mean police stop looking for other suspects while the real perpetrator remains free (and, in some documented cases, goes on to commit further crimes). At trial, an eyewitness's in-court identification — someone looking a jury in the eye and stating certainty — is widely recognized as some of the most persuasive testimony a jury will hear, even though decades of research show confidence and accuracy are only weakly related. And at sentencing and on appeal, a confident identification is difficult to unwind without new evidence (DNA, a corroborated alternate suspect, or a documented procedural flaw) — courts are reluctant to overturn a conviction based on a witness simply being wrong.",
    distinctions: [
      "A wrong identification does not automatically mean the witness lied. Misidentification and perjury are different failures — one is an honest, mistaken memory; the other is a knowing falsehood.",
      "A suggestive identification procedure does not by itself prove an investigator acted in bad faith. Non-blind administration and confirming feedback are common practices researchers have identified as risky, not evidence of intentional misconduct.",
      "An identification made with confidence at trial does not mean it was made with confidence at the time. Confidence can grow after the fact; the number that matters most, memory researchers argue, is the certainty a witness expressed the first time, not years later on the stand.",
    ],
    scenario: {
      incident:
        "Just after 11:40 p.m. on a Tuesday in early spring, a man walked into a convenience store on a quiet commercial stretch and pointed a handgun at the clerk, a 24-year-old named Marcus Webb working alone. The encounter lasted well under a minute. The man demanded the cash drawer, said almost nothing else, and left on foot. Marcus had been staring mostly at the gun. The store's overhead lighting was fluorescent and uneven, and the register sat several feet back from the door, in the store's dimmest corner. The robber wore a dark hooded sweatshirt pulled low and kept his chin down. The store's camera system had been flagged as malfunctioning by a technician five days earlier and hadn't yet been repaired. Responding officers found no fingerprints usable for comparison — the man appeared to have worn gloves — and no forensic evidence beyond a partial, unusable smudge on the counter. What investigators had was a single frightened witness, a rough physical description (Black male, roughly 5'10\"–6'0\", medium build, dark hoodie), and a store register missing about $340.",
      initialInvestigation:
        "Two days later, an anonymous tip came into the department's tip line: a caller who declined to give a name said a man in the neighborhood, 22-year-old Devon Price, \"had been talking about\" the robbery. Devon had a prior arrest — dismissed, non-violent — from eighteen months earlier, so his photo was already on file. There was no physical evidence connecting him to the scene, no surveillance footage, and no informant relationship on record; the tip was the entire basis for looking at him. The lead detective built a six-photo array, including Devon's booking photo alongside five other men matched loosely on age and general appearance, and brought it to Marcus for a viewing four days after the robbery.",
      whereProblemBegins:
        "The array was administered by the same detective who had developed Devon as a suspect — not by a blind administrator with no knowledge of which photo was the suspect's, which is the procedure memory researchers recommend precisely because it removes the possibility of an administrator's own certainty leaking through, even unintentionally. Devon's photo, older and taken under different lighting than the five fillers, was subtly more saturated than the others. Marcus studied the array for close to a minute, went back and forth between photo #3 (Devon) and photo #5, and said he genuinely wasn't sure. The detective, wanting a workable answer for the file, said, \"Take another look at three — does anything stand out?\" Marcus looked again and said, \"Maybe. I think that's him. I'm not, like, certain, but I'd say maybe seventy percent.\" The detective wrote in his report that the witness had \"positively identified suspect Price from the array,\" without recording the hesitation, the specific percentage Marcus gave, or the prompt that preceded his answer.",
      howInvestigationDevelops:
        "With an identification on paper, the file effectively closed as a matter of departmental priority. Devon's alibi — that he had been at a friend's apartment that night — was noted but not seriously pursued; the friend had an old drug possession charge, and the detective's supplemental report characterized him as \"not a credible corroborating witness\" without independently checking the apartment building's exterior camera, which in fact would have shown Devon entering the building at 11:15 p.m. and not leaving until the next morning. A separate, similar robbery at a store nine blocks away two weeks earlier — caught clearly on that store's working camera, showing a man who did not resemble Devon — was never cross-referenced against this case, because by the time anyone might have connected them, this file already had \"an identification.\"",
      snowballChain: [
        "Anonymous tip names a suspect with no supporting evidence",
        "Photo array is built and administered around that one suspect",
        "Non-blind administration + confirming feedback shape a hesitant, 70%-confidence pick",
        "Report records only \"positively identified,\" not the hesitation or the prompt",
        "Alibi witness is dismissed rather than independently checked",
        "A similar-MO robbery with contrary evidence is never cross-referenced",
        "By trial, the case looks like a clean, confidently-identified robbery",
      ],
      snowballNarrative:
        "None of this required anyone to act with malice. A detective under real caseload pressure wanted a usable answer; a tired witness wanted to be helpful; an alibi that looked, on paper, less than airtight got less scrutiny than it deserved. Each individual choice was small and, in isolation, defensible to the person making it. But each one also foreclosed a different question — Was the identification actually confident? Was the alibi actually checked? Could this be the same person as the earlier robbery? — and by the time the file reached a prosecutor, those unanswered questions had simply stopped being asked. This is what researchers call tunnel vision: not a conspiracy, but a narrowing of focus around an early theory, in which each subsequent piece of information gets interpreted through that theory rather than tested against it.",
      courtroomNarrative:
        "By the time Marcus Webb took the stand fourteen months later, the case had become, in his own mind, settled. He had looked at Devon's photo in preparation meetings with the prosecutor, had rehearsed his account several times, and had spent over a year knowing the state believed Devon was the man who robbed him.",
      whatJuryHears:
        "\"I got a good look at him. I picked him out of the photos right away, and I've never doubted it. That's the man who robbed me.\"",
      whatRecordShows:
        "The original police report — never shown to the jury in those words — records a witness who deliberated for close to a minute, said he was \"maybe seventy percent\" sure, and was prompted to \"take another look\" at the suspect's photo before settling on an answer.",
      conviction:
        "The defense, represented by an overburdened public defender carrying more than 100 open cases, did not retain an eyewitness-identification expert and did not obtain the neighboring store's surveillance footage from the earlier robbery. The jury, hearing a confident in-court identification and no rebuttal to it, convicted Devon Price of armed robbery after roughly ninety minutes of deliberation. He was sentenced to nine years.",
      yearsLater:
        "Four years into the sentence, a newly assigned detective reviewing a string of unsolved commercial robberies from that period noticed the earlier, camera-documented robbery nine blocks away and pulled the original footage during a cold-case review. It clearly showed a man with a distinctive forearm scar — visible because that robber's sleeve rode up — that did not match Devon. Cross-referencing the store's employee-schedule records and a parole database led investigators to a man already incarcerated for an unrelated armed robbery with a similar method. Confronted with the footage, he confirmed details of both robberies that had never been made public. A county innocence clinic took up Devon's case, obtained the original, unredacted police report with the detective's contemporaneous notes, and used it — along with the apartment building's camera log, still on file — to petition for post-conviction relief. The conviction was vacated two years later.",
      breakdown: {
        whatHappened:
          "A witness gave a hesitant, roughly 70%-confidence identification after a suggestive procedure and a confirming prompt; the paperwork recorded it as a positive identification with no qualifiers, and the case was built and tried around that record rather than the actual event.",
        whyItMattered:
          "It convicted an innocent man and, for years, left the actual perpetrator free to commit further robberies using the same method.",
        whatShouldHaveBeenExamined:
          "The identification procedure itself (non-blind administration, a photo that stood out, confirming feedback); the alibi (never independently checked against available camera footage); and the similar unsolved robbery nine blocks away (never cross-referenced).",
        whatSafeguardCouldHaveHelped:
          "Blind or blinded lineup administration; a contemporaneous, verbatim record of the witness's stated confidence at the moment of identification, not just the final answer; and a departmental practice of cross-referencing open cases with a similar method before treating a single tip-driven identification as solved.",
      },
      biggerLesson:
        "None of this requires an investigator who wanted to convict the wrong person. It requires ordinary, human shortcuts — a caseload that rewards closing files, a belief that forms early and then filters everything after it, a witness who wants to be helpful and slowly becomes certain of something he was never certain of at the time. That's exactly why the safeguards researchers recommend (blind administration, documented initial confidence, independent corroboration of alibis) don't depend on anyone's good faith to work. They're designed to catch the error even when everyone involved is trying to do their job well.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "taron-hill":
        "The case against Taron Hill rested on a single eyewitness identification made through a procedure using only one photo — not a full lineup or array — along with two jailhouse informants who later recanted. No forensic evidence ever tied him to the crime, and New Jersey's Conviction Review Unit later cited the flawed identification procedure as a central reason for vacating his conviction.",
      "anthony-ray-hinton":
        "The surviving victim, Sidney Smotherman, identified Anthony Ray Hinton from a photo lineup after an acquaintance told police a composite sketch resembled him — an identification made under the pressure of having just survived being shot. It combined with disputed ballistics evidence to become the case against him; no other physical evidence tied him to the crimes.",
      "anthony-ways":
        "The conviction rested on a single eyewitness, a driver who was near-sighted and not wearing his glasses the night of the shooting. He picked Anthony Ways from a photo lineup in which Ways was the only person wearing a hat — matching the witness's vague description of the shooter's clothing rather than any distinguishing physical feature.",
    },
    biggerPicture:
      "The research is consistent across very different samples: whether you look at the Innocence Project's DNA-exoneration cases (62%) or the National Registry's full, much larger database (27%), eyewitness misidentification is one of the most common documented threads running through wrongful convictions — the exact share depends heavily on which cases you're counting. The mechanism explains why: memory is reconstructive, stress and poor viewing conditions degrade it further, and ordinary identification procedures can unintentionally shape what a witness ends up saying. Xonorate's own documented cases — Taron Hill, Anthony Ray Hinton, and Anthony Ways — show that mechanism playing out in the real record: a single-photo showup, a post-shooting composite-sketch identification, and a suggestive lineup where one filler simply didn't match. None of these cases required anyone to lie. They required an identification procedure that wasn't built to catch its own errors.",
    relatedIssueSlugs: [
      slugify("Official misconduct"),
      slugify("False confession"),
      slugify("Jailhouse informants"),
    ],
    sources: [
      {
        label: "DNA Exonerations in the United States",
        organization: "Innocence Project",
        url: SOURCE_URL,
        note: "n=257 client cases; current as of April 2026",
      },
      {
        label: "Exonerations by Contributing Factor",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/exonerations-contributing-factor",
        note: "Full registry, 3,861 exonerations since 1989",
      },
      {
        label: "Understanding the Registry — contributing factor definitions",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/understanding-registry",
      },
    ],
  },
  {
    tag: "False confession",
    slug: slugify("False confession"),
    title: "False confessions",
    dek: "Admitting to a crime you didn't commit.",
    explanation:
      "A false confession is a statement — recorded, written, or simply recalled by an interrogator — in which someone admits to a crime they did not commit. It sounds almost impossible until you look at how interrogations actually work. Standard American police interrogation technique is built, by design, to produce an admission: it isolates a suspect, forecloses denial as an option, and offers a face-saving way out (\"it was an accident,\" \"you must have blacked out\") once resistance breaks down. That design is very effective at getting guilty people to admit what they did. It is also, under the wrong conditions — exhaustion, youth, intellectual disability, mental illness, grief, or simply hours of unrelenting pressure — capable of producing the same admission from someone innocent. A confession does not require anyone to lie about it afterward; it can be entirely real, entirely voluntary in the legal sense, and still entirely false.",
    stat: { value: "29%", label: "of Innocence Project client cases" },
    statistics: [
      {
        value: "29%",
        sourceLabel: "Innocence Project",
        sourceUrl: SOURCE_URL,
        dataset: "Innocence Project DNA-exoneration client cases",
        population: "People exonerated by DNA evidence and represented by the Innocence Project",
        timePeriod: "Cumulative total, current as of April 2026",
        casesAnalyzed: "257 cases",
        whatItMeans:
          "Nearly 3 in 10 of the Innocence Project's 257 DNA-exoneration cases involved a false confession or false admission — often from the defendant, sometimes from a co-defendant. It does not mean 29% of all wrongful convictions, or all criminal cases, involve a false confession; DNA-exoneration cases are a specific, serious-crime-skewed population, not a cross-section of the criminal legal system.",
      },
      {
        value: "13%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/exonerations-contributing-factor",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, all crime types combined",
        timePeriod: "Cumulative since 1989, current registry-wide figure (3,861 exonerations)",
        casesAnalyzed: "3,861 exonerations",
        whatItMeans:
          "Across the Registry's full, much larger population — not limited to DNA cases — false confessions are a documented factor in roughly 13% of exonerations. False confessions are disproportionately associated with the most serious, highest-pressure interrogations (homicides in particular), which is part of why the narrower, more serious-crime-weighted Innocence Project sample shows a higher share.",
      },
    ],
    howItHappens: [
      {
        title: "An interrogation begins",
        body: "A suspect — sometimes a witness with no attorney present, sometimes already a formal suspect — is brought in for questioning, typically alone, without a support person, and without knowing how long the process will take.",
      },
      {
        title: "Isolation and repeated questioning",
        body: "Standard technique separates a suspect from family, friends, and often sleep, sometimes for many hours, before or during the substantive interrogation. Isolation and fatigue measurably reduce a person's ability to resist pressure and think clearly.",
      },
      {
        title: "Presentation of the investigators' theory",
        body: "Interrogators, trained to project certainty of guilt, present their theory of the crime as settled fact — sometimes describing crime-scene details the suspect didn't know, which can later appear (wrongly) to corroborate a confession that actually just absorbed fed information.",
      },
      {
        title: "Minimization and a face-saving way out",
        body: "A common, legal technique offers the suspect a less culpable version of events (\"it sounds like it was self-defense,\" \"you probably just don't remember because of the shock\") — making admission feel like the easiest, safest path forward, especially to someone who has been told, sometimes falsely, that a test or piece of evidence has already proven their guilt.",
      },
      {
        title: "Fatigue and prolonged questioning",
        body: "The longer an interrogation runs, the more a suspect's guard — and, in documented cases, their grip on their own memory — erodes. Prolonged sessions are a factor in a disproportionate share of documented false confessions.",
      },
      {
        title: "Eventual admission",
        body: "Under sustained pressure, exhaustion, and a presented narrative that feels like the only way to end the interrogation, a suspect admits to some or all of the offense — sometimes in the interrogators' own words, absorbed over hours of repeated suggestion.",
      },
      {
        title: "Lack of independent corroboration",
        body: "A reliable confession should contain details only the true perpetrator could know — details that can be checked against the physical evidence. When a confession instead just echoes facts the interrogators already had, there is nothing independently confirming it actually came from guilty knowledge.",
      },
    ],
    whyItMatters:
      "Once a confession exists in the file, it reshapes everything that follows. Investigators who already have an admission often stop pursuing other leads — including a real perpetrator who remains free. Prosecutors build the case around the confession as its centerpiece, because a jury that hears \"the defendant admitted it\" tends to discount almost everything else, including a recantation, an alibi, or forensic evidence that doesn't fit. Defense attorneys face an enormous uphill climb: jurors, understandably, find it difficult to believe an innocent person would ever say they did something they didn't do, so even a strong argument about interrogation pressure often loses to the raw fact of the admission. And at the plea-negotiation stage, a confession — however it was obtained — becomes powerful leverage to extract a guilty plea, sometimes to a fabricated account of guilt, from someone who has already been shown that resistance doesn't seem to work.",
    distinctions: [
      "A false confession does not mean the person who gave it is unusually weak-willed. Standard interrogation techniques are designed to produce admissions, and documented research shows they can produce them from innocent people under the right conditions — most people can be led to that point given enough pressure, exhaustion, and false certainty from the questioner.",
      "Not every disputed confession is false. What distinguishes a reliable confession from an unreliable one is independent corroboration — details a true perpetrator would know, confirmed against evidence the confessor could not have simply learned from the interrogators themselves.",
    ],
    scenario: {
      incident:
        "In the early hours of a winter morning, a house fire in a small town killed six-year-old Ellie Voss and injured no one else. Her older brother, seventeen-year-old Caleb, had been alone with her while their parents worked an overnight shift; he woke to smoke, called 911, and pulled two neighbors toward the house before firefighters arrived, but couldn't reach Ellie's room through the smoke. The responding fire investigator's initial walk-through leaned toward an accidental electrical fire starting near an outlet in the living room, but because a child had died, the scene was treated as a potential homicide pending further review, standard practice for any fatal fire. A preliminary read of the burn pattern on the living-room floor — an irregular, low, spreading char mark — was flagged by the investigator as \"possibly consistent with an accelerant,\" a finding that would later turn out to rest on visual indicators fire scientists have since shown are not actually reliable evidence of accelerant use at all.",
      initialInvestigation:
        "As the only person in the house besides Ellie, Caleb was, by default, the person investigators most needed to hear from. He was asked to come to the station \"to walk through what happened\" less than six hours after the fire, having not slept, and having just watched his sister's body removed from their home. He agreed, believing he was helping. No physical evidence yet suggested arson — the burn-pattern read was preliminary and, as later reanalysis would show, based on outdated indicators — but the interrogating detectives, trained in a confrontation-based technique, treated the fire's cause as effectively settled from the outset.",
      whereProblemBegins:
        "The interview, which investigators later described in reports as \"an initial account,\" ran more than nine hours with only brief breaks. Partway through, detectives told Caleb — falsely, though not illegally — that he had \"failed\" a polygraph exam. Polygraph results are inadmissible in court precisely because the technique doesn't reliably measure truthfulness, but police lying to a suspect about the result is a legal tactic. They then offered him a way to explain a \"failure\" that didn't require him to be a monster: maybe he'd been smoking near the outlet, maybe something caught, maybe the trauma of what happened next made him block it out. Grief-stricken, exhausted, and now doubting a memory he'd already been turning over for hours, Caleb started to consider it.",
      howInvestigationDevelops:
        "Over two more interview sessions across the following two days, detectives described specific details of how they believed the fire started — where, with what, roughly when. Caleb, still without an attorney, began incorporating those details into his own account, sometimes phrasing them almost exactly as the detectives had. Investigators treated this as him \"finally remembering,\" rather than as him absorbing information he'd been given repeatedly under pressure.",
      snowballChain: [
        "A preliminary burn-pattern read, based on now-discredited indicators, is treated as evidence of arson",
        "The only person present becomes the default suspect",
        "A nine-hour interrogation begins hours after the trauma, without sleep",
        "A false \"failed polygraph\" claim is used to apply pressure",
        "A face-saving \"you must have blacked out\" narrative is offered",
        "Fed details are incorporated into the suspect's own account over repeated sessions",
        "The resulting statement is treated as a confirmed, voluntary confession",
      ],
      snowballNarrative:
        "No single moment here required anyone to act in bad faith. A preliminary forensic read that turned out to be wrong wasn't malicious — it reflected genuinely held (if outdated) beliefs about fire indicators that were standard in fire investigation for decades. An interrogation technique built to produce admissions worked exactly as designed. What made it a wrongful conviction wasn't one bad actor; it was a chain in which each link — the burn-pattern theory, the default suspicion of the lone survivor, the confrontational interrogation, the polygraph deception, the face-saving narrative — made the next link easier to accept, until a grieving teenager's exhausted, fed-detail account looked, on paper, like a confession.",
      courtroomNarrative:
        "By trial, the recorded statement — not the full nine-hour interrogation, just the final, cleaned-up segment — was presented as Caleb's own voluntary account of what happened.",
      whatJuryHears:
        "\"I did it. I lit something near the outlet. I don't really remember why.\"",
      whatRecordShows:
        "The statement was recorded in hour nine of a sleep-deprived interrogation, followed detectives' own previously stated theory of the fire's origin point almost verbatim, and got a key physical detail — the specific side of the room where the fire actually started, later confirmed by independent analysis — wrong.",
      conviction:
        "The public defender assigned to Caleb's case, carrying a large caseload, did not retain a false-confession expert or an independent fire-science expert to challenge the original burn-pattern finding. The jury, hearing what sounded like a clear admission, convicted him of manslaughter and arson. He was sentenced as a juvenile tried as an adult to a lengthy term.",
      yearsLater:
        "Nearly a decade later, a re-examination of the case — prompted by the broader, field-wide reassessment of fire-investigation methodology after NFPA 921's revised standards discredited several long-used \"signs of arson\" as unreliable folklore — found the original burn-pattern conclusion could not be scientifically supported. An independent fire-cause-and-origin engineer, retained by a post-conviction clinic, traced the fire's actual origin to a faulty extension cord beneath Ellie's bed, matching a cord model later subject to a manufacturer safety notice. Caleb's conviction was vacated.",
      breakdown: {
        whatHappened:
          "A discredited fire-investigation indicator triggered a homicide investigation into the fire's only survivor, who gave a fed, uncorroborated statement after nine sleepless hours and a false polygraph claim.",
        whyItMattered:
          "It convicted a grieving teenager of killing his own sister, based on a statement that echoed his interrogators rather than independent knowledge of the crime.",
        whatShouldHaveBeenExamined:
          "The reliability of the original burn-pattern finding; whether the statement contained any detail Caleb could only have known independently; and the effect of nine hours of sleep-deprived, grief-compounded interrogation on the reliability of anything said in it.",
        whatSafeguardCouldHaveHelped:
          "Full recording of the entire interrogation, not just the final statement; a rule against using a false polygraph result as an interrogation tactic on a minor; and a requirement that a confession be corroborated by a detail investigators did not already possess before it can anchor a prosecution.",
      },
      biggerLesson:
        "A confession feels like the end of any real doubt — someone said they did it, in their own words. But those words can be produced, lawfully and without any single bad actor, by ordinary interrogation technique applied to someone exhausted, grieving, or young enough to trust that the adults in the room already know what happened. That's exactly why researchers and reform advocates push for full recording and independent corroboration: not because interrogators are assumed to be acting in bad faith, but because the technique works too well to be trusted on its own.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    biggerPicture:
      "Both major sources agree false confessions are a real, recurring factor in wrongful convictions — they just disagree on scale, because they're counting different populations (29% of a smaller, DNA-exoneration sample vs. 13% of the full, much larger registry). The common thread across both is mechanism, not deception: standard interrogation technique is built to produce admissions, and under the right pressure — isolation, exhaustion, youth, grief — it can produce a false one just as readily as a true one. Xonorate does not yet have a documented client or spotlight case built primarily around a false confession; when one is added to the archive, it will appear here as a real-world example, the same way Taron Hill's case already does for jailhouse informants.",
    relatedIssueSlugs: [slugify("Official misconduct"), slugify("Inadequate legal defense")],
    sources: [
      {
        label: "DNA Exonerations in the United States",
        organization: "Innocence Project",
        url: SOURCE_URL,
        note: "n=257 client cases; current as of April 2026",
      },
      {
        label: "Exonerations by Contributing Factor",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/exonerations-contributing-factor",
        note: "Full registry, 3,861 exonerations since 1989",
      },
    ],
  },
  {
    tag: "Jailhouse informants",
    slug: slugify("Jailhouse informants"),
    title: "Jailhouse informants",
    dek: "Testimony traded for a deal.",
    explanation:
      "A jailhouse informant is someone who was incarcerated alongside a defendant — usually while awaiting trial on their own, unrelated charges — and later testifies that the defendant confessed to them. It's testimony that arrives with an obvious credibility problem built in: the person offering it typically has real charges of their own, and real reasons (a reduced sentence, dropped charges, better conditions, or a benefit never formally written down) to give prosecutors testimony that helps their case. Because that arrangement is often not fully disclosed to the jury — and because an alleged private confession between two people is nearly impossible to independently verify — informant testimony has proven to be one of the least reliable, and most reversible, forms of evidence used to convict.",
    stat: { value: "19%", label: "of Innocence Project client cases" },
    statistics: [
      {
        value: "19%",
        sourceLabel: "Innocence Project",
        sourceUrl: SOURCE_URL,
        dataset: "Innocence Project DNA-exoneration client cases",
        population: "People exonerated by DNA evidence and represented by the Innocence Project",
        timePeriod: "Cumulative total, current as of April 2026",
        casesAnalyzed: "257 cases",
        whatItMeans:
          "Informant testimony was a factor in roughly 1 in 5 of the Innocence Project's 257 DNA-exoneration cases. It does not mean 1 in 5 criminal cases generally involve a jailhouse informant — DNA-exoneration cases skew toward serious, often high-profile crimes where prosecutors have the strongest incentive to develop informant testimony.",
      },
      {
        value: "7%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/jailhouse-informants",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, all crime types",
        timePeriod: "Report dated November 5, 2024; registry snapshot of September 26, 2024",
        casesAnalyzed: "247 of 3,591 exonerations",
        whatItMeans:
          "Across the Registry's much broader population, jailhouse informants appear in a smaller overall share — but that share is heavily concentrated by crime type: the Registry's own analysis found informants testified in 15% of murder exonerations specifically, versus about 2% of exonerations for other crimes. The 19% Innocence Project figure and the 7% Registry-wide figure aren't really in tension once you account for this — DNA-exoneration cases (the Innocence Project's population) are disproportionately murder and sexual-assault cases, exactly where informant testimony concentrates.",
      },
    ],
    howItHappens: [
      {
        title: "Pretrial detention creates the opportunity",
        body: "A defendant awaiting trial is often held in a county jail alongside people facing their own, unrelated charges — some of whom have strong incentives to find a way to help themselves.",
      },
      {
        title: "Case details become available",
        body: "Details about a pending case can circulate through jail rumor, shared discovery documents, news coverage, or simply conversation — giving a would-be informant raw material to build a plausible-sounding account, with or without the defendant ever actually saying anything.",
      },
      {
        title: "An offer is made",
        body: "The informant, often already facing significant charges of their own, approaches investigators or prosecutors with an account of an alleged confession, explicitly or implicitly signaling they'd like something in return.",
      },
      {
        title: "A benefit is negotiated",
        body: "Reduced charges, a lighter sentencing recommendation, dropped charges, or other consideration is arranged — sometimes through an informal understanding rather than a written agreement, which later makes the benefit easier to describe as \"no deal\" to a jury.",
      },
      {
        title: "The benefit is minimized at trial",
        body: "Jurors are frequently told the informant is testifying voluntarily, or that only a modest benefit was involved, when the real arrangement was considerably more valuable to the informant.",
      },
      {
        title: "The account is made persuasive",
        body: "A compelling informant account often includes specific details about the crime — details that feel like only the true perpetrator could know, but that may have reached the informant through the channels above rather than a genuine confession.",
      },
      {
        title: "Limited cross-examination",
        body: "Because the defense frequently doesn't have full visibility into the informant's criminal history, prior use as an informant in other cases, or the true scope of the deal, cross-examination often can't test the account as thoroughly as it should.",
      },
    ],
    whyItMatters:
      "Jailhouse informant testimony most often enters a case during the investigation-to-prosecution stage, when a case already feels weak and prosecutors are looking for anything that corroborates their theory — which is exactly the moment an informant's offer is most tempting to accept without exhaustive scrutiny. Once accepted, it becomes evidence at trial that's extraordinarily difficult for a defense to rebut: disproving a claimed private conversation is close to impossible, and jurors tend to find it hard to believe someone would simply invent a detailed confession out of nothing. On appeal and in post-conviction review, unwinding an informant-based conviction usually requires the informant to recant, or requires new disclosure of the true benefit they received — both of which can take years, or decades, to surface.",
    distinctions: [
      "An informant later recanting does not always mean the original testimony was a deliberate lie from the start — but the incentive structure around informant testimony means it should be scrutinized closely regardless of whether it's ever recanted.",
      "A prosecutor stating \"no promises were made\" can be technically accurate while an informal, unwritten understanding about future benefit still existed — which is part of why some jurisdictions now require broader disclosure of an informant's full history of cooperation, not just a single case's formal deal.",
    ],
    scenario: {
      incident:
        "A convenience-store robbery turned fatal when the owner, resisting, was shot once and died at the scene. There were no witnesses to the shooting itself, no usable forensic evidence beyond a partial shoe print, and a description from a passerby — a young Black man in a gray jacket running from the area — vague enough to fit thousands of people in the city. Detectives had a description, a shoe print, and little else three weeks in.",
      initialInvestigation:
        "An anonymous tip pointed detectives toward 24-year-old Derrick Boone, who had a prior robbery conviction and lived two blocks from the store. He was arrested primarily on the tip and the loose physical description; he denied any involvement and had no connection detectives could verify to the murder weapon, which was never recovered. The case, six weeks in, remained largely circumstantial — until a name surfaced from inside the county jail, where Derrick was being held pending trial.",
      whereProblemBegins:
        "Anthony Reyes, a 31-year-old facing a lengthy sentence on an unrelated drug-distribution charge, was housed in the same unit as Derrick for eleven days. Reyes approached his own attorney with a claim: Derrick had confessed the robbery-murder to him in detail, including where he'd disposed of the gun. Reyes's attorney relayed the offer to the prosecutor's office. Within three weeks, Reyes's drug charge — which had carried a mandatory-minimum exposure of roughly eight years — was renegotiated down to a plea with a recommended sentence of eighteen months, formally described in the file as unrelated to his cooperation in the Boone case.",
      howInvestigationDevelops:
        "Reyes's account included a specific detail: that the gun had been thrown into a storm drain three blocks from the store. Detectives searched the drain and found a .38-caliber revolver consistent with the fatal wound. To investigators, this felt like powerful corroboration — an informant's tip had led directly to the murder weapon. What the file didn't reflect was that the drain search had been preceded, four days earlier, by an evidence technician's incident log noting the same drain had already been flagged as a \"possible disposal site\" based on the original shoe-print trajectory — information that had been discussed at a briefing Reyes's own attorney had, coincidentally, been present for as part of an unrelated matter that morning.",
      snowballChain: [
        "A weak, largely circumstantial case sits without a break for six weeks",
        "An informant facing serious unrelated charges offers a detailed \"confession\" account",
        "A substantial, informally negotiated sentence reduction follows",
        "The informant's account leads to real physical evidence, seemingly confirming it",
        "The possibility that the informant had independent access to that same information goes unexamined",
        "The jury is told the informant received no benefit tied to his testimony",
        "The corroborated-sounding informant account becomes the centerpiece of the case",
      ],
      snowballNarrative:
        "Nobody had to fabricate anything for this to go wrong. A prosecutor facing a thin case reasonably wanted corroboration; an informant facing years in prison had every reason to offer some; and the drain search's real origin — an internal briefing, not a jailhouse confession — was simply never cross-checked against the timeline. Each step, taken alone, looks like ordinary casework. Together, they turned an informant's plausible account, built on information he plausibly could have picked up rather than a genuine confession, into what looked at trial like independently corroborated proof.",
      courtroomNarrative:
        "Reyes testified that Derrick had confessed unprompted, in detail, while they were housed together, and that he had come forward purely out of conscience.",
      whatJuryHears:
        "\"He told me exactly what happened and where he threw the gun. I wasn't promised anything — I just felt it was right to come forward.\"",
      whatRecordShows:
        "Reyes's own drug case was resolved with a sentence reduction from a roughly eight-year mandatory-minimum exposure to eighteen months within three weeks of his offer, and the drain location he \"revealed\" had already been separately flagged by investigators days before he says Derrick told him.",
      conviction:
        "The defense, unaware of the internal evidence log placing the drain under suspicion before Reyes's claim, was unable to challenge the corroboration directly. The jury convicted Derrick largely on Reyes's testimony and the recovered weapon. He was sentenced to life.",
      yearsLater:
        "Nine years later, a post-conviction investigator obtained the full evidence log through a renewed records request and found the internal drain notation predating Reyes's claim. Separately, Reyes — by then released and willing to speak after learning the case was under review — acknowledged he had been present at an unrelated hallway conversation between an evidence technician and his own attorney the week before his offer, where the drain location had come up. He maintained he still believed Derrick was guilty, but could no longer say with confidence the gun-location detail hadn't come from that conversation rather than a confession. The conviction was vacated on the combined weight of the undisclosed log and the informant's own admission of uncertainty.",
      breakdown: {
        whatHappened:
          "An informant facing serious unrelated charges received a substantial, informally arranged benefit in exchange for a \"confession\" account whose most corroborating detail may have come from information already circulating among investigators, not from the defendant.",
        whyItMattered:
          "It gave a weak, largely circumstantial case the appearance of independent corroboration, and became the deciding evidence at trial.",
        whatShouldHaveBeenExamined:
          "Whether the informant had any independent access to the drain location before his claim; the full scope and timing of his sentence benefit; and whether the jury was given an accurate picture of that benefit.",
        whatSafeguardCouldHaveHelped:
          "Mandatory, detailed disclosure of an informant's complete cooperation history and benefit timeline; a reliability hearing before informant testimony is admitted in serious cases; and a documented chain-of-custody check on how a corroborating detail was actually obtained.",
      },
      biggerLesson:
        "An informant's account can look like independent corroboration when it's really just information that reached the informant through an ordinary channel — jail talk, a shared hallway, a document left in view — rather than a genuine confession. The incentive to offer testimony that helps a weak case is powerful and entirely predictable; the safeguard has to be structural disclosure and verification, not a jury's read on whether a witness seems sincere.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "taron-hill":
        "Two jailhouse informants corroborated the single-photo eyewitness identification against Taron Hill at trial — both later recanted. New Jersey's Conviction Review Unit cited that recantation, alongside the flawed identification procedure, as central reasons for vacating his conviction.",
    },
    biggerPicture:
      "The two major figures here — 19% of Innocence Project DNA cases, 7% registry-wide — describe the same underlying pattern at different scales: informant testimony concentrates heavily in the most serious cases, especially murder, which is exactly the population DNA exonerations skew toward. Xonorate's own documented case shows the mechanism directly: two informants corroborated Taron Hill's conviction, and both recanted once the case was reopened — a real-world instance of exactly the reliability problem the research describes.",
    relatedIssueSlugs: [
      slugify("Official misconduct"),
      slugify("Perjury or false accusation"),
      slugify("Mistaken witness identification"),
    ],
    sources: [
      {
        label: "DNA Exonerations in the United States",
        organization: "Innocence Project",
        url: SOURCE_URL,
        note: "n=257 client cases; current as of April 2026",
      },
      {
        label: "Jailhouse Informants",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/jailhouse-informants",
        note: "247 of 3,591 exonerations (7%); 15% of murder exonerations specifically. Report dated Nov. 5, 2024.",
      },
    ],
  },
  {
    tag: "False or misleading forensic evidence",
    slug: slugify("False or misleading forensic evidence"),
    title: "Forensic error",
    dek: "The lab coat isn't proof.",
    explanation:
      "Forensic disciplines that sound scientific — bite-mark analysis, hair microscopy, arson pattern reading, and some fingerprint, ballistics, and tool-mark comparisons — have been used in court for decades without the rigorous, statistically validated testing the word \"science\" implies. Most of these are pattern-matching disciplines: an examiner looks at two things (a bite mark and a dental cast, a bullet and a test-fired casing) and reaches a subjective judgment about whether they're consistent. A 2009 National Academy of Sciences report and a 2016 White House PCAST report both found that, with the partial exception of DNA analysis, most of these disciplines lack the error-rate studies needed to support the near-certainty many examiners historically claimed in court. \"Forensic error,\" as an exoneration category, covers both an examiner reaching a wrong conclusion and an examiner overstating how certain a correct-sounding conclusion actually is — and both have sent people to prison for crimes the underlying evidence never actually proved.",
    stat: { value: "52%", label: "of Innocence Project client cases" },
    statistics: [
      {
        value: "52%",
        sourceLabel: "Innocence Project",
        sourceUrl: SOURCE_URL,
        dataset: "Innocence Project DNA-exoneration client cases",
        population: "People exonerated by DNA evidence and represented by the Innocence Project",
        timePeriod: "Cumulative total, current as of April 2026",
        casesAnalyzed: "257 cases",
        whatItMeans:
          "In just over half of the Innocence Project's 257 DNA-exoneration cases, misapplied or misleading forensic science was a factor. Because these are, by definition, cases where DNA later proved innocence, they are unusually likely to have involved another, less reliable forensic method at trial — that's part of why this figure runs higher than the Registry's full-population figure below, not a sign that one source is wrong.",
      },
      {
        value: "29%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/exonerations-contributing-factor",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, all crime types",
        timePeriod: "Cumulative since 1989, current registry-wide figure (3,861 exonerations)",
        casesAnalyzed: "3,861 exonerations",
        whatItMeans:
          "Across the Registry's full population — including many cases with no biological evidence to retest at all — false or misleading forensic evidence is a documented factor in about 29% of exonerations. The gap from 52% largely reflects that the Innocence Project's cases are pre-selected for having DNA to test, which correlates with the kinds of violent, forensic-evidence-heavy cases where flawed pattern-matching testimony is most likely to appear in the first place.",
      },
    ],
    howItHappens: [
      {
        title: "Evidence is collected at the scene",
        body: "Physical evidence — a bite mark, hair, a shell casing, a tool mark, burn patterns — is collected and sent for analysis, often to a lab affiliated with law enforcement rather than an independent institution.",
      },
      {
        title: "A pattern-matching method is applied",
        body: "Many forensic disciplines rely on an examiner's subjective visual judgment about whether two things are \"consistent\" — a judgment shaped by training, but without the large-scale, blind error-rate studies that back up disciplines like DNA analysis.",
      },
      {
        title: "A match is declared",
        body: "The examiner concludes a match, exclusion, or \"consistent with\" finding — a conclusion that can be affected, research shows, by knowing which result investigators are hoping for, even without any intent to mislead.",
      },
      {
        title: "Certainty is overstated in testimony",
        body: "Analysts have historically testified to a level of certainty — \"to the exclusion of all other individuals in the world,\" for instance — that the underlying method has never been shown able to support.",
      },
      {
        title: "The defense often can't afford a rebuttal expert",
        body: "Retaining an independent forensic expert to challenge a state analyst's conclusion is expensive; many defendants, especially those with overworked public defenders, go to trial with the state's forensic conclusion effectively unchallenged.",
      },
      {
        title: "The jury treats \"forensic science\" as inherently reliable",
        body: "Jurors, reasonably, tend to give scientific-sounding testimony significant weight — without visibility into which disciplines have been independently validated and which haven't.",
      },
      {
        title: "Later re-examination overturns the finding",
        body: "Years or decades later, DNA testing, a field-wide methodological reassessment (as happened with bite-mark analysis and some fire-science indicators), or an independent re-review reveals the original conclusion could not actually be supported by the method used.",
      },
    ],
    whyItMatters:
      "Forensic error typically enters a case at the investigation stage, when a lab result or expert opinion either confirms suspicion of a particular person or helps build probable cause for an arrest. From there, it shapes the entire prosecution: a confident-sounding forensic \"match\" is often the single piece of evidence a jury finds hardest to doubt, because it's presented as objective science rather than one person's subjective judgment. It can also affect the defense's own strategy — an attorney facing a state expert's confident testimony, without funding for an independent expert, may have little choice but to attack credibility rather than substance. And on appeal, overturning a forensic-error conviction typically requires either new DNA testing or a broader field-wide reassessment of the method itself, both of which can take years to materialize.",
    distinctions: [
      "A forensic error doesn't always mean the analyst was being dishonest. Many now-discredited techniques — bite-mark analysis chief among them — were treated as legitimate, court-accepted science for decades before rigorous validation studies caught up with them.",
      "A conviction being overturned on forensic grounds doesn't mean the analyst \"lied\" on the stand. Often the technique itself was never capable of the certainty that was claimed, regardless of the analyst's own good-faith belief in their conclusion.",
    ],
    scenario: {
      incident:
        "A convenience-store clerk was shot during a robbery attempt just after closing; he survived but couldn't identify his attacker, who wore a mask. Investigators recovered two spent .40-caliber shell casings from the scene — the only physical evidence beyond a partial shoe impression outside the back door.",
      initialInvestigation:
        "A confidential source told police that 26-year-old Marcus Odell, who had a prior weapons charge, had been seen with a .40-caliber handgun in the weeks before the robbery. Officers obtained a warrant, recovered a handgun matching that caliber from Odell's apartment, and submitted it along with the two recovered casings to the state crime lab's firearms and tool-mark unit for comparison.",
      whereProblemBegins:
        "The lab's tool-mark examiner test-fired Odell's weapon and compared the resulting casings to the two from the scene under a comparison microscope. Tool-mark identification relies on an examiner's visual judgment that microscopic striations left on a casing by a specific gun's firing mechanism are unique enough to \"match\" — a claim the field's own 2009 and 2016 national validation reviews found lacks the error-rate research to support the certainty routinely claimed in court. The examiner concluded the casings had been fired by Odell's weapon \"to the exclusion of every other firearm in the world,\" language common in tool-mark testimony at the time but unsupported by any validated error-rate study for the discipline.",
      howInvestigationDevelops:
        "With what investigators treated as a confirmed ballistics match, other leads went unpursued — including a second confidential tip, never fully investigated, naming a different person with a documented history of robberies in the same commercial corridor. The case, thin on evidence before the tool-mark result, was treated internally as effectively solved once the lab report came back.",
      snowballChain: [
        "A caliber match and a prior weapons charge make one person the focus",
        "A tool-mark comparison — a subjective, unvalidated pattern-matching method — declares a \"match\"",
        "The match is described in the report with a certainty the method cannot scientifically support",
        "Investigators treat the case as solved and stop pursuing an unrelated tip",
        "The defense, without funding for an independent tool-mark expert, cannot meaningfully rebut the state's finding",
        "The jury hears the match described as conclusive, scientific proof",
      ],
      snowballNarrative:
        "The examiner likely believed the conclusion. Tool-mark comparison training, for decades, taught exactly this kind of confident, absolute-sounding language as the field's professional standard — it wasn't a fabrication so much as an entire discipline overstating what its own method could actually prove. The deeper failure was structural: no independent proficiency testing required, no blind verification by a second examiner, and no funding on the defense side to challenge a conclusion dressed in scientific authority.",
      courtroomNarrative:
        "The state's firearms examiner testified as an expert witness, describing years of training and thousands of prior comparisons.",
      whatJuryHears:
        "\"Based on the unique striations, I can say to a reasonable degree of scientific certainty that these casings were fired from this weapon, to the exclusion of every other firearm.\"",
      whatRecordShows:
        "No national or state validation study has established a reliable, measured error rate for tool-mark comparison at the level of certainty claimed; a defense reanalysis years later, using a blind second-examiner protocol, found the original comparison \"inconclusive\" rather than a confirmed match.",
      conviction:
        "With no independent expert to counter the state's confident testimony, the defense could only argue credibility in closing. The jury convicted Odell of attempted murder and armed robbery.",
      yearsLater:
        "Eight years later, a state forensic-oversight commission — established after unrelated crime-lab misconduct came to light elsewhere in the state — ordered a retrospective audit of tool-mark cases from the same examiner's tenure. An independent, blinded re-analysis of the original casings, conducted for the audit, concluded the comparison was inconclusive rather than a match, consistent with the discipline's actual, more limited scientific capability. Combined with the previously unpursued second tip, which by then had connected to a confession in an unrelated case, the conviction was vacated.",
      breakdown: {
        whatHappened:
          "A subjective tool-mark comparison was reported and testified to with a certainty the method has never been validated to support, and it became the case's central evidence.",
        whyItMattered:
          "It ended pursuit of another viable lead and became the deciding evidence at trial for a discipline that cannot actually support the certainty claimed.",
        whatShouldHaveBeenExamined:
          "Whether tool-mark comparison, as a discipline, could scientifically support an \"exclusion of every other firearm\" conclusion at all; and whether a second, blind examiner reviewed the finding before it was reported.",
        whatSafeguardCouldHaveHelped:
          "Mandatory blind verification by a second examiner; testimony limited to language the discipline's actual validation research can support; and defense funding for an independent forensic expert in any case where the state's forensic evidence is central.",
      },
      biggerLesson:
        "Forensic testimony's power in a courtroom comes from sounding like objective science — but several widely used pattern-matching disciplines were accepted in court for decades before anyone rigorously tested whether they could support the certainty examiners claimed. The failure here isn't one dishonest analyst; it's an entire evidentiary category whose court-accepted confidence outran its actual scientific validation, for far longer than it should have.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "anthony-ray-hinton":
        "State forensic examiners testified that all six bullets from three related crimes were fired from one .38-caliber revolver found under a relative's mattress — ballistics testimony that was the only physical evidence tying Hinton to the murders. Independent experts later disputed that conclusion.",
      "kennedy-brewer":
        "Brewer was convicted largely on bite-mark testimony from a forensic dentist, who testified that marks on the victim's body were human bite marks matching Brewer's teeth. The marks were later determined to be insect bites, and DNA testing excluded Brewer entirely.",
    },
    biggerPicture:
      "Both figures here — 52% of Innocence Project DNA cases, 29% registry-wide — point to the same underlying problem: pattern-matching forensic disciplines were used in American courtrooms for decades with far more confidence than their actual scientific validation could support. Xonorate's documented cases show two different versions of that failure: Anthony Ray Hinton's case rested on disputed ballistics conclusions, and Kennedy Brewer's rested on bite-mark testimony from a method later shown to be unreliable — in Brewer's case, marks that turned out to be insect bites, not a human bite at all.",
    relatedIssueSlugs: [
      slugify("Official misconduct"),
      slugify("Inadequate legal defense"),
      slugify("Mistaken witness identification"),
    ],
    sources: [
      {
        label: "DNA Exonerations in the United States",
        organization: "Innocence Project",
        url: SOURCE_URL,
        note: "n=257 client cases; current as of April 2026",
      },
      {
        label: "Exonerations by Contributing Factor",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/exonerations-contributing-factor",
        note: "Full registry, 3,861 exonerations since 1989",
      },
    ],
  },
  {
    tag: "Official misconduct",
    slug: slugify("Official misconduct"),
    title: "Official misconduct",
    dek: "Prosecutorial and police misconduct, including suppressed evidence.",
    explanation:
      "Prosecutors and police are constitutionally required to turn over evidence that could help a defendant — a rule known as Brady disclosure, after the 1963 Supreme Court case Brady v. Maryland — and are required not to coach witnesses, conceal cooperation deals, or knowingly build a case around evidence they have reason to doubt. \"Official misconduct,\" as the National Registry of Exonerations defines it, is deliberately broad: it covers police, prosecutors, or other government officials significantly abusing their authority or the judicial process in a way that contributed to a conviction, and it explicitly includes withheld exculpatory evidence as one of its subcategories. When any of that happens, the resulting conviction rests on a version of events the jury — and the defense — was never allowed to fully see. Xonorate tags what are sometimes discussed separately as prosecutorial misconduct, police misconduct, and suppressed evidence all under this one category, matching how the Registry itself codes it, because the harm to the defendant is the same regardless of which official was responsible.",
    statistics: [
      {
        value: "61%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/exonerations-contributing-factor",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, all crime types",
        timePeriod: "Cumulative since 1989, current registry-wide figure (3,861 exonerations)",
        casesAnalyzed: "3,861 exonerations",
        whatItMeans:
          "Official misconduct — police, prosecutorial, or both, including withheld evidence — is the single most common contributing factor tracked in the entire Registry, present in roughly three out of every five documented exonerations. The Innocence Project doesn't publish a comparable headline figure for this category on its exonerations-data page, so this is presented as a single, well-documented figure rather than as a comparison between two sources.",
      },
    ],
    dataNote:
      "This figure covers every documented form of official misconduct the Registry tracks, from a single undisclosed police report to deliberate fabrication of evidence — it does not distinguish degrees of culpability, and its prevalence is especially concentrated in homicide cases. " +
      DATA_NOTE_DEFAULT,
    howItHappens: [
      {
        title: "Evidence is gathered during the investigation",
        body: "Investigators collect statements, physical evidence, and leads — including, in many cases, information that points away from the person who is eventually charged.",
      },
      {
        title: "Some of that evidence undermines the emerging theory",
        body: "An alternate suspect, an inconsistent witness statement, an unfavorable forensic result, or an informant's undisclosed deal doesn't fit the story investigators or prosecutors have already begun building.",
      },
      {
        title: "A decision is made not to disclose it",
        body: "Rather than turning that material over to the defense, as constitutionally required, it's left out of what's shared — sometimes through active concealment, sometimes through a disorganized file where it's simply never flagged.",
      },
      {
        title: "The trial proceeds without it",
        body: "The defense builds its case, and the jury reaches its verdict, without access to information that could have changed how the evidence was weighed.",
      },
      {
        title: "A conviction is obtained on an incomplete record",
        body: "The jury convicts based on the version of the case it was shown — a version that, unknown to it, was missing material the defendant had a right to see.",
      },
      {
        title: "The withheld material eventually surfaces",
        body: "Years or decades later, a records request, a whistleblower, a retiring official's files, or a post-conviction reinvestigation brings the missing material to light.",
      },
      {
        title: "Undoing the conviction requires extraordinary litigation",
        body: "Because the original trial record looked complete at the time, unwinding a conviction built partly on withheld evidence typically requires post-conviction counsel to prove both that the evidence existed and that it would have mattered — a high bar, even once the material is found.",
      },
    ],
    whyItMatters:
      "Official misconduct can enter a case at almost any stage — during the investigation (evidence collection or witness handling), at charging (a decision to proceed despite known weaknesses), during plea negotiations (undisclosed information that would affect a defendant's decision to plead), or at trial itself (testimony or argument the prosecution knows or should know is misleading). Wherever it happens, its effect compounds: a defense attorney can't investigate a lead they don't know exists, can't cross-examine a witness about a deal they were never told about, and can't argue reasonable doubt using evidence that was never disclosed. Because the concealment is often not discovered until well after conviction — sometimes only when an official's later case, unrelated litigation, or a journalist's records request surfaces it — official misconduct is disproportionately associated with the longest-running wrongful convictions in the Registry's data, including several of the cases the Registry has documented from the 1970s and 1980s.",
    distinctions: [
      "Official misconduct covers a wide spectrum, from a single undisclosed report in an otherwise good-faith investigation to a knowing, deliberate frame-up — the Registry codes both the same way, but the individual culpability involved is not identical.",
      "A conviction being reversed for a disclosure violation does not always mean prosecutors acted in bad faith. Some violations stem from disorganized files or an oversight rather than intentional concealment — though the harm to the defendant is the same either way, which is exactly why the disclosure rule doesn't turn on intent.",
    ],
    scenario: {
      incident:
        "A late-night stabbing outside a bar left one man dead and his friend seriously injured. The surviving friend, in shock and having consumed several drinks, described the attacker only as \"a Black guy, maybe six feet, dark clothes\" — a description that would end up fitting a large share of the neighborhood's young men.",
      initialInvestigation:
        "Detectives received a tip from a bar employee who said she'd seen 22-year-old Jamal Rivers arguing with the victim earlier that night over a spilled drink. Jamal was brought in, denied any involvement beyond the earlier verbal exchange, and gave an alibi: he'd left with two friends roughly forty minutes before the stabbing and gone to a diner two miles away. Detectives obtained receipts confirming a card purchase at the diner around the estimated time of the stabbing, under a different friend's name, but the timing was close enough to the estimated time of death that it wasn't immediately treated as conclusive.",
      whereProblemBegins:
        "During a canvass of nearby businesses, a gas station two blocks from the bar turned up exterior camera footage showing a man matching the surviving witness's description running from the direction of the bar roughly twelve minutes after the diner receipt was time-stamped — a window that would have made it physically difficult, though not impossible, for Jamal to be the person on the footage. The lead detective reviewed the footage, noted in a personal case log (never entered into the shared file) that \"timing looks tight for Rivers, worth checking further,\" and did not forward the footage or the log entry to the prosecutor's office or the defense.",
      howInvestigationDevelops:
        "With the bar employee's tip and the general physical match, the case proceeded toward Jamal as the primary suspect. The diner receipt was disclosed to the defense as part of routine discovery, but without the gas-station footage to establish the actual walking distance and time, the defense had no way to argue the timeline made his guilt implausible — the receipt alone, without a reference point, read as ambiguous rather than exculpatory.",
      snowballChain: [
        "A vague description and a prior verbal dispute make one person the focus",
        "An alibi with a supporting receipt emerges but isn't conclusive on its own",
        "Camera footage surfaces that would clarify the timeline in the defendant's favor",
        "The footage and a note flagging the timing concern are never forwarded",
        "The defense argues the alibi without the evidence that would make it compelling",
        "The incomplete record supports a conviction the full record likely wouldn't have",
      ],
      snowballNarrative:
        "The detective's private note — \"worth checking further\" — shows the doubt existed. What turned that doubt into a wrongful conviction wasn't a single dramatic act of concealment; it was a decision, whether through caseload pressure, overconfidence in the existing theory, or a belief the footage was inconclusive anyway, not to put that doubt into the shared file where the prosecutor and defense would have to reckon with it. Tunnel vision doesn't require intent to convict an innocent person — it just requires treating disconfirming information as not worth the paperwork.",
      courtroomNarrative:
        "The prosecutor argued the diner receipt didn't rule Jamal out, since the timing was \"close enough\" to allow for the stabbing beforehand.",
      whatJuryHears:
        "\"The defense wants you to believe the receipt clears him, but the timing works either way — he could have been at the bar and still made it to the diner.\"",
      whatRecordShows:
        "Gas-station footage, never disclosed, showed a man matching the general description at a location and time that — combined with the diner receipt — made it extremely difficult to reconcile with Jamal having been at the bar at the time of the stabbing at all.",
      conviction:
        "Without the footage, the jury found the timeline argument unpersuasive against the bar employee's identification and convicted Jamal of manslaughter. He was sentenced to fourteen years.",
      yearsLater:
        "Eleven years later, a public-records lawsuit filed by a journalism student's innocence-project seminar, seeking the department's full case file rather than just the disclosed portions, surfaced the detective's original log entry and a records request to the gas station's corporate office located archived footage from the original investigation, still on file under an unrelated retention policy. A frame-by-frame timing analysis by a defense-retained investigator showed the man in the footage could not plausibly have reached the diner by the receipt's timestamp — meaning he likely wasn't Jamal at all. The conviction was vacated.",
      breakdown: {
        whatHappened:
          "Camera footage and an investigator's own documented doubt about the timeline were never disclosed to the defense or included in the shared case file.",
        whyItMattered:
          "It deprived the defense of the evidence needed to make its strongest, and likely decisive, argument — that the timeline made Jamal's guilt implausible.",
        whatShouldHaveBeenExamined:
          "Whether the gas-station footage was consistent or inconsistent with the defendant's alibi, and why a documented internal doubt about the timing was never shared.",
        whatSafeguardCouldHaveHelped:
          "A department policy requiring every investigative note and piece of collected evidence — not just what an individual detective judges relevant — to be logged in the shared, disclosable case file; and an independent disclosure-compliance review before trial in cases resting on eyewitness identification alone.",
      },
      biggerLesson:
        "The Brady disclosure rule exists precisely because a defendant can't argue with evidence they don't know exists, and a jury can't weigh doubt it's never shown. Official misconduct, in cases like this, doesn't require a conspiracy — it can be as simple as one person's private note never making it into a shared file, and a system with no independent check to catch that gap before trial.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "ricky-jackson":
        "Police fed details to a 12-year-old boy who had not actually witnessed the crime, intimidated him when he tried to recant, and suppressed both that attempted recantation and an undisclosed cash payment made to him — a case the National Registry of Exonerations documents in detail. Jackson served 39 years before his conviction was vacated.",
      "kennedy-brewer":
        "The Registry documents official misconduct alongside the bite-mark testimony that convicted Brewer — evidence and process failures that, combined with the later-discredited forensic testimony, contributed to his wrongful conviction and death sentence.",
      "anthony-ways":
        "A key witness testified at a post-conviction hearing that she had been coached by the prosecutor and that police let her keep drugs they had planted on her in exchange for her cooperation — testimony that, along with a named alternate suspect who repeatedly admitted guilt to others, led to Ways's conviction being reversed.",
    },
    biggerPicture:
      "At 61% of the full Registry, official misconduct is the single most common documented factor in wrongful convictions nationally — and it's disproportionately concentrated in the highest-stakes cases (NRE's 2023 annual report found official misconduct in 85% of that year's homicide exonerations). Xonorate's documented cases show the range the Registry's broad definition covers: from Ricky Jackson's case, where police fed a story to a child witness and suppressed his attempted recantation, to Anthony Ways's, where a witness said she was coached by a prosecutor and given drugs by police in exchange for testimony. Neither required a citywide conspiracy — each required a handful of officials deciding not to share what they knew.",
    relatedIssueSlugs: [
      slugify("Perjury or false accusation"),
      slugify("Jailhouse informants"),
      slugify("Inadequate legal defense"),
    ],
    sources: [
      {
        label: "Exonerations by Contributing Factor",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/exonerations-contributing-factor",
        note: "Full registry, 3,861 exonerations since 1989",
      },
      {
        label: "Understanding the Registry — contributing factor definitions",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/understanding-registry",
      },
    ],
  },
  {
    tag: "Inadequate legal defense",
    slug: slugify("Inadequate legal defense"),
    title: "Ineffective counsel",
    dek: "A defense in name only.",
    explanation:
      "Every defendant has a constitutional right to counsel — but a right to counsel is not the same as a right to a competent defense. The National Registry of Exonerations codes a case as involving \"inadequate legal defense\" when a trial attorney provided obviously and grossly inadequate representation, and it deliberately does not require a formal court ruling of \"ineffective assistance of counsel\" to count a case this way — because the constitutional legal standard for that ruling (from the 1984 Supreme Court case Strickland v. Washington) sets a bar so high that many cases of genuinely poor representation never meet it. An overworked public defender carrying hundreds of open cases, or a private attorney who never investigates an alibi, never interviews an available witness, or never challenges weak forensic or eyewitness evidence, can leave a genuinely innocent client with no real defense at trial at all — whether or not a later court is willing to call that failure \"ineffective\" in the constitutional sense.",
    statistics: [
      {
        value: "33%–35%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2024_Annual_Report.pdf",
        dataset: "National Registry of Exonerations annual reports",
        population: "Exonerations recorded within a single calendar year (2024 and 2025 cohorts)",
        timePeriod: "2024 annual report (48 of that year's exonerations) and 2025 annual report (56 of 158)",
        whatItMeans:
          "Unlike eyewitness misidentification, false confessions, official misconduct, and the other factors on this page, inadequate legal defense isn't one of the five factors the Registry tracks in its all-time, full-database \"Contributing Factor\" comparison chart — so there isn't a single clean cumulative percentage to cite the way there is for those. What the Registry's own year-by-year annual reports show is a consistent range: roughly a third of each year's newly recorded exonerations involved inadequate legal defense (33% in 2024, about 35% in 2025). That range, not a single all-time figure, is the most accurate way to represent what's actually published.",
      },
    ],
    dataNote:
      "Because inadequate legal defense is tracked through the Registry's annual reports rather than its all-time contributing-factor comparison, the figure above reflects two recent individual years rather than one cumulative, all-time percentage. " +
      DATA_NOTE_DEFAULT,
    howItHappens: [
      {
        title: "Counsel is assigned or retained",
        body: "A defendant is represented either by appointed counsel — often a public defender carrying a caseload far above recommended limits — or by private counsel operating with limited time or resources for the case.",
      },
      {
        title: "An obvious lead goes uninvestigated",
        body: "An alibi witness is never interviewed, an alternate suspect is never looked into, or an available record that would support the defense is never requested.",
      },
      {
        title: "No independent expert is retained",
        body: "Forensic or eyewitness-identification evidence the prosecution presents as scientific or certain goes unchallenged because no defense expert is hired to test it — often for lack of funding, sometimes from a misunderstanding of what funding is actually available.",
      },
      {
        title: "Trial preparation is minimal",
        body: "Limited time translates into limited preparation — few or no defense witnesses called, minimal cross-examination strategy, and a defense built reactively rather than around an independent theory of the case.",
      },
      {
        title: "The prosecution's case goes largely uncontested",
        body: "Without independent investigation or expert rebuttal, the jury effectively hears only one side's account of the physical and testimonial evidence.",
      },
      {
        title: "A conviction follows",
        body: "The defendant is convicted based on a trial record that, retrospectively, looks less like an adversarial proceeding and more like an uncontested presentation of the prosecution's theory.",
      },
      {
        title: "The constitutional standard is difficult to meet on appeal",
        body: "Even where the representation was plainly inadequate, showing it meets the Strickland standard — that performance fell below an objective standard of reasonableness AND that it changed the outcome — is a high bar that many clearly poor defenses still don't clear.",
      },
    ],
    whyItMatters:
      "Inadequate defense doesn't just affect the trial itself — it compounds every stage that follows it. A weak defense investigation means weaker plea-negotiation leverage, since a defendant's attorney has little independently discovered evidence to bargain with. At trial, it means the prosecution's theory goes substantially unchallenged, and the jury never hears the strongest version of reasonable doubt the case might have actually supported. On appeal, it creates a uniquely difficult problem: courts are generally reluctant to second-guess trial strategy, and the constitutional standard for reversing a conviction on this basis requires proving not just that the representation was bad, but that a better defense would likely have changed the result — a showing that's hard to make without exactly the investigation the original attorney never did.",
    distinctions: [
      "Losing a case is not the same as receiving ineffective assistance of counsel. The constitutional standard requires both that the attorney's performance fell below an objective standard of reasonableness and that it likely affected the outcome — a bar most ordinary attorney mistakes, even real ones, don't meet.",
      "An overworked public defender's caseload is a systemic funding and resource problem, not necessarily a personal failure by that individual attorney — many public defenders do everything they can within caseloads that make thorough investigation of every case functionally impossible.",
    ],
    scenario: {
      incident:
        "A home burglary turned violent when the homeowner returned mid-crime and was struck with a blunt object, suffering a serious head injury. He survived but had no memory of the attack itself. Police found a broken window, a discarded pillowcase used to carry stolen items, and a partial shoe impression in a flower bed beneath the window.",
      initialInvestigation:
        "A neighbor reported seeing a young man she didn't recognize walking away from the area around the estimated time of the burglary. Two days later, 20-year-old Trevon Ellis was arrested after a separate, unrelated stop turned up jewelry later identified as belonging to the victim, which Trevon said he'd bought from an acquaintance he knew only by a nickname, for what he believed was a legitimate secondhand price.",
      whereProblemBegins:
        "Trevon was assigned a public defender carrying, at the time, more than 150 open felony cases — roughly three times the caseload national standards recommend for an attorney to provide effective representation. Trevon gave his attorney the acquaintance's nickname and the general area where he said he'd bought the jewelry, along with the name of a coworker who could confirm he'd been at work, not at the burglarized home, during the estimated time window. In a single fifteen-minute meeting three weeks before trial, the attorney — managing multiple trial dates that same week — took notes on both leads but, due to the caseload, never followed up on either: no investigator was assigned to locate the acquaintance, and the coworker was never contacted.",
      howInvestigationDevelops:
        "At trial, the prosecution presented the jewelry, the shoe impression (never independently tested against Trevon's actual shoes, which were a different size than the impression suggested but which no defense expert ever compared), and the neighbor's general description. The defense, without its own investigation to offer an alternative account, was limited to cross-examining the state's witnesses rather than presenting any affirmative case of its own.",
      snowballChain: [
        "An attorney with a caseload nearly three times recommended limits is assigned",
        "Two specific, checkable leads — the acquaintance and the alibi witness — are given but never investigated",
        "No defense investigator or independent expert is retained to test the physical evidence",
        "The shoe-impression size discrepancy goes unexamined and unchallenged",
        "The defense case at trial consists only of cross-examination, with no affirmative evidence",
        "The prosecution's uncontested theory becomes the only version the jury hears",
      ],
      snowballNarrative:
        "No one decided to lose this case on purpose. An attorney facing three times a manageable caseload made the same triage decision, case after case, that an unmanageable workload forces: focus limited time on trials happening that week, not leads in a case still weeks out. By the time Trevon's trial arrived, both leads that might have changed the outcome — the coworker who could confirm his alibi, the shoe size that didn't match — had simply never been checked. That's not a strategic choice a competent, adequately resourced attorney would make; it's what an impossible caseload produces by default.",
      courtroomNarrative:
        "The prosecution argued the jewelry and the shoe impression, taken together, left no real doubt.",
      whatJuryHears:
        "\"The defense hasn't offered any explanation for the jewelry beyond a name they can't even fully identify, and hasn't challenged the physical evidence at all.\"",
      whatRecordShows:
        "The defendant's actual shoe size did not match the recovered impression — a discrepancy no defense expert ever tested or raised — and a coworker who could have placed him at work during the burglary was never contacted by defense counsel despite being given the name three weeks before trial.",
      conviction:
        "With no affirmative defense presented, the jury convicted Trevon of burglary and aggravated assault. He was sentenced to twelve years.",
      yearsLater:
        "Five years in, a post-conviction legal clinic reviewing public defender caseload records as part of a broader systemic study flagged Trevon's case for review given his attorney's caseload at the time of trial. Clinic investigators located both the coworker, who confirmed the alibi with time-clock records still on file, and — through the acquaintance's nickname and a old social-media search — the actual source of the jewelry, who acknowledged selling it to Trevon and separately implicated a different person in the burglary itself. An independent shoe-impression comparison confirmed the size discrepancy. The conviction was vacated.",
      breakdown: {
        whatHappened:
          "Two specific, checkable leads capable of establishing an alibi and explaining the jewelry were never investigated because the assigned attorney's caseload made real investigation impossible.",
        whyItMattered:
          "It left the defendant with no affirmative case at trial, against physical evidence that — once actually tested — didn't match him.",
        whatShouldHaveBeenExamined:
          "The named alibi witness, the acquaintance who could explain the jewelry, and whether the recovered shoe impression actually matched the defendant's own shoes.",
        whatSafeguardCouldHaveHelped:
          "Enforceable public defender caseload limits with real consequences for exceeding them; a dedicated defense investigator assigned to every case involving physical evidence; and a rule allowing continuances when defense counsel documents genuinely unmanageable caseload conflicts.",
      },
      biggerLesson:
        "The right to counsel means little if the counsel provided has no realistic capacity to investigate, test evidence, or track down a named witness. This isn't usually a story about a bad lawyer — it's a story about a system that assigns an impossible number of cases to one person and then treats the resulting gaps in investigation as a private failure rather than a structural one.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "anthony-ray-hinton":
        "Trial counsel wrongly believed defense expert funding was capped at $1,000 — an older cap that had actually been replaced by a statute allowing \"any expenses reasonably incurred\" with judicial approval — so he hired a firearms expert he knew was unqualified rather than seeking proper funding for a qualified one.",
      "kevin-baker":
        "Kevin Baker maintained an alibi that he was with his girlfriend the night of the shooting, but his trial attorney never called her as a witness. The alibi was later corroborated during a post-conviction reinvestigation that also uncovered contradicting forensic evidence.",
    },
    biggerPicture:
      "Unlike the other issues on this page, inadequate legal defense doesn't have one clean, all-time national percentage — the Registry tracks it through annual reports showing roughly a third of each year's exonerations involve it, rather than through its all-time contributing-factor chart. What's consistent across every source is the mechanism: a defense that never investigates an available lead leaves an innocent client with no real case at trial. Xonorate's documented cases show exactly that pattern twice — Anthony Ray Hinton's attorney hired an expert he knew was unqualified over a funding misunderstanding, and Kevin Baker's attorney never called the girlfriend who could confirm his alibi.",
    relatedIssueSlugs: [
      slugify("Official misconduct"),
      slugify("False or misleading forensic evidence"),
      slugify("Mistaken witness identification"),
    ],
    sources: [
      {
        label: "2024 Annual Report",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2024_Annual_Report.pdf",
        note: "48 of 2024's exonerations (33%) involved inadequate legal defense",
      },
      {
        label: "2025 Annual Report",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/sites/exonerationregistry.org/files/documents/2025Exonerations.pdf",
        note: "56 of 158 of 2025's exonerations (about 35%) involved inadequate legal defense",
      },
      {
        label: "Understanding the Registry — contributing factor definitions",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/understanding-registry",
      },
    ],
  },
  {
    tag: "Perjury or false accusation",
    slug: slugify("Perjury or false accusation"),
    title: "Perjury or false accusation",
    dek: "A knowing lie under oath.",
    explanation:
      "Perjury or false accusation, as the National Registry of Exonerations defines it, means someone other than the exonerated person made a false statement — under oath, or an unsworn statement that would have been perjury if it had been made under oath — that incriminated the person for the crime they were later cleared of. It's a distinct category from eyewitness misidentification for one crucial reason: this is a knowing falsehood, not an honest mistake. A witness settling a grudge, protecting the actual perpetrator, or naming someone under pressure from police to produce a suspect isn't misremembering — they're saying something they know isn't true. That distinction matters both morally and legally, and it also makes this kind of wrongful conviction especially hard to unwind: courts have historically treated a later recantation with deep skepticism, on the theory that a witness who lied once might be lying again by recanting, which means overturning a conviction built on false testimony often requires far more than the false witness simply admitting it.",
    statistics: [
      {
        value: "64%",
        sourceLabel: "National Registry of Exonerations",
        sourceUrl: "https://exonerationregistry.org/exonerations-contributing-factor",
        dataset: "Full National Registry of Exonerations database",
        population: "Every exoneration in the Registry, all crime types",
        timePeriod: "Cumulative since 1989, current registry-wide figure (3,861 exonerations)",
        casesAnalyzed: "3,861 exonerations",
        whatItMeans:
          "Perjury or false accusation is the most common single factor the Registry tracks across its full database — present in roughly 64% of all documented exonerations. The Innocence Project's own exonerations-data page doesn't publish a comparable figure for this specific category, so this is presented as a single well-documented figure rather than a comparison. It's worth noting this category is broad by design: it covers everything from a frightened witness naming the wrong person under police pressure to a co-defendant deliberately lying to shift blame, which is part of why it's so frequently present.",
      },
    ],
    dataNote: DATA_NOTE_DEFAULT,
    howItHappens: [
      {
        title: "A witness has a motive to lie",
        body: "Fear of being charged themselves, a personal grudge, a desire to protect the actual perpetrator, or pressure from investigators to produce a name can all create a reason to give a false account.",
      },
      {
        title: "A statement is given to police",
        body: "The false account is given, sworn or unsworn, often during an interview where the witness may believe cooperating — in whatever form investigators seem to want — will benefit them.",
      },
      {
        title: "The statement becomes central evidence",
        body: "Once given, the statement often becomes the anchor of the investigation, shaping which leads get pursued and which get deprioritized.",
      },
      {
        title: "Contrary evidence is minimized",
        body: "Evidence that doesn't fit the false account — an alibi, a physical inconsistency, another suspect — can be discounted once a seemingly cooperative witness has already provided a clean narrative.",
      },
      {
        title: "The statement is repeated under oath at trial",
        body: "The witness testifies consistent with their earlier statement, now formalized as sworn courtroom testimony, carrying significant weight with a jury.",
      },
      {
        title: "A later recantation is met with skepticism",
        body: "If the witness eventually recants, courts have historically treated recantations as inherently unreliable — reasoning that someone willing to lie once might be lying again — which makes a true recantation and a false one hard to distinguish procedurally.",
      },
      {
        title: "Post-conviction relief requires more than the recantation alone",
        body: "Because recantations are legally disfavored as a basis for relief on their own, unwinding the conviction typically requires independent corroboration — new evidence, another witness, or physical proof — not just the original witness admitting they lied.",
      },
    ],
    whyItMatters:
      "A knowing false statement can distort a case from the earliest investigative stages straight through to post-conviction review. At the investigation stage, it can point police toward the wrong person entirely, while the actual perpetrator goes unpursued. At trial, sworn testimony from a witness who appears to have no reason to lie is often difficult for a defense to overcome, particularly when the witness has no obvious incentive visible to the jury. And in the appellate and post-conviction stages, the legal system's structural skepticism toward recantations — a rule designed to prevent witnesses from being pressured into recanting true testimony — can end up protecting a false conviction just as effectively as it protects a true one, requiring years of additional investigation to find the corroboration courts will actually credit.",
    distinctions: [
      "A recanted statement does not, by itself, prove the original statement was false — courts require independent corroboration precisely because recantations can go in either direction, which is one reason convictions built on perjury are so difficult to unwind even after the witness comes forward.",
      "Perjury is a knowing falsehood, which makes it fundamentally different from an honest witness who was simply, sincerely wrong — that's misidentification, a different issue with a different mechanism, even though both can look similar from the outside once they're part of a trial record.",
    ],
    scenario: {
      incident:
        "A late-night gas station robbery ended with the clerk pistol-whipped and the register emptied. Two accomplices had waited in a car nearby; one, 19-year-old Malik Turner, was arrested two weeks later after the getaway vehicle was traced to him through a parking ticket issued that same night.",
      initialInvestigation:
        "Malik admitted to driving the car but insisted he believed he was waiting for a friend running an errand, not participating in a robbery, and that he didn't know who had actually gone inside. Detectives pressed him to name the other person; he maintained he genuinely didn't know, since he said he'd been recruited to drive that night by someone he'd only recently met.",
      whereProblemBegins:
        "Investigators located 22-year-old Darius Combs, who had been in the car with Malik, and brought him in separately. Darius, facing a probation violation on an unrelated charge that could have sent him back to prison for the remainder of a multi-year suspended sentence, was told plainly that his cooperation in identifying who went into the station would be considered. Darius — who had, in fact, gone into the station himself — told detectives that a third person, 20-year-old Andre Wells, had been the one who went inside and committed the robbery, while he and Malik waited outside. Andre had a prior robbery conviction and lived in the same apartment complex as Darius.",
      howInvestigationDevelops:
        "With a named suspect and an eyewitness account from someone who was, according to his own statement, present at the scene, detectives treated Andre as the primary suspect. Andre denied any involvement and said he had been at his sister's apartment that night, a claim his sister supported but that investigators treated as an expectedly biased family alibi. Darius's probation violation was quietly not pursued following his statement, formally recorded in the file as a routine, unrelated administrative closure.",
      snowballChain: [
        "A cooperating witness, facing his own serious legal exposure, names someone else as the actual perpetrator",
        "His own unrelated legal jeopardy is quietly resolved shortly afterward",
        "The named suspect's family alibi is treated as inherently less credible",
        "No physical evidence is ever found connecting the named suspect to the scene",
        "The cooperating witness's own physical description to the clerk is never rigorously compared against himself",
        "The case proceeds to trial built substantially on the uncorroborated accusation",
      ],
      snowballNarrative:
        "Darius's statement solved an immediate problem for investigators — a named suspect, an account of what happened — and solved an immediate problem for Darius, whose own legal exposure quietly diminished right after he gave it. Neither of those things required anyone to consciously frame an innocent man; it required investigators to accept a convenient, unverified account from someone with an obvious, if unstated, incentive to give one, and to not look hard enough at whether he might have been describing his own actions rather than someone else's.",
      courtroomNarrative:
        "Darius testified that he had waited outside with Malik while Andre went in and committed the robbery, and denied any deal was involved in his own case.",
      whatJuryHears:
        "\"I didn't get anything for testifying. I'm just telling you what I saw that night — Andre's the one who went in.\"",
      whatRecordShows:
        "Darius's probation violation, which carried years of potential incarceration, was administratively closed nine days after he identified Andre, a timeline never disclosed to the jury as connected to his cooperation.",
      conviction:
        "The jury, hearing an apparently disinterested eyewitness account and no comparably strong alternative, convicted Andre of armed robbery. He was sentenced to eleven years.",
      yearsLater:
        "Six years later, Darius — by then facing a new, unrelated charge and reportedly motivated by a religious conversion during a prior jail stay, according to his own later statement — contacted a post-conviction attorney and admitted he had been the one who went into the station, and that he'd named Andre because Andre had a prior record and seemed, in Darius's words, \"like someone who'd already used up his chances anyway.\" Investigators corroborated the recantation with the original store surveillance footage, re-examined with updated image-enhancement technology, showing a build and gait more consistent with Darius than with Andre, and located phone records placing Andre's phone near his sister's apartment for the relevant window. The conviction was vacated.",
      breakdown: {
        whatHappened:
          "A cooperating witness with serious, undisclosed legal incentive falsely named someone else as the person who committed the robbery he had actually committed himself.",
        whyItMattered:
          "It convicted an innocent man based substantially on one uncorroborated, incentivized accusation, while the actual perpetrator avoided consequences for years.",
        whatShouldHaveBeenExamined:
          "The timing and scope of the benefit Darius received after naming Andre; whether the physical description given to the clerk was ever compared against Darius himself; and why the family alibi was discounted without independent verification.",
        whatSafeguardCouldHaveHelped:
          "Mandatory disclosure of any change in a cooperating witness's own legal status, however \"routine,\" occurring near the time of their statement; a requirement that accusatory testimony from a person present at the scene be independently corroborated before being used as the primary basis for a conviction; and image-enhancement review of available surveillance footage before trial, not only after a post-conviction claim.",
      },
      biggerLesson:
        "An accusation from someone who was genuinely present at a crime can sound exactly like credible eyewitness testimony — the difference is whether they're honestly describing what they saw, or protecting themselves by describing someone else's actions as another person's. Because that difference isn't visible on the witness stand, it has to be tested structurally: by disclosing every incentive a witness has, and by requiring corroboration before a single accusation becomes the case.",
    },
    documentedCasesNote: DOCUMENTED_CASES_NOTE_DEFAULT,
    caseNotes: {
      "ricky-jackson":
        "A 12-year-old boy who had not actually witnessed the murder was pressured by police into naming Ricky Jackson and two others as the perpetrators. He recanted decades later, testifying he had relied only on a street rumor and had never seen the crime at all.",
      "anthony-ways":
        "A key witness gave police one account, then testified to a different, more incriminating version at trial — later admitting at a post-conviction hearing that she had been coached by the prosecutor. A separately named alternate suspect repeatedly admitted guilt to multiple people, including Ways's own cousin.",
      "kennedy-brewer":
        "The National Registry of Exonerations documents perjury or false accusation alongside the discredited bite-mark testimony that convicted Brewer, contributing to his wrongful capital murder conviction before DNA testing identified the actual perpetrator.",
    },
    biggerPicture:
      "At 64%, perjury or false accusation is the single most commonly documented factor across the entire National Registry of Exonerations — more common even than official misconduct or eyewitness misidentification. Xonorate's own documented cases show why it's so damaging and so hard to unwind: Ricky Jackson spent 39 years imprisoned before a coerced child witness recanted, and Anthony Ways's coached witness testimony took over a decade of post-conviction litigation to overcome, even with a named alternate suspect repeatedly confessing to others in the meantime.",
    relatedIssueSlugs: [
      slugify("Official misconduct"),
      slugify("Jailhouse informants"),
      slugify("Mistaken witness identification"),
    ],
    sources: [
      {
        label: "Exonerations by Contributing Factor",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/exonerations-contributing-factor",
        note: "Full registry, 3,861 exonerations since 1989",
      },
      {
        label: "Understanding the Registry — contributing factor definitions",
        organization: "National Registry of Exonerations",
        url: "https://exonerationregistry.org/understanding-registry",
      },
    ],
  },
];

export const ISSUES_SOURCE_URL = SOURCE_URL;

export function getIssueBySlug(slug: string): IssueDefinition | undefined {
  return ISSUES.find((issue) => issue.slug === slug);
}
