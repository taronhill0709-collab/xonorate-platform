/**
 * One-off: adds three exonerated-person "spotlight" cases sourced from the
 * National Registry of Exonerations (exonerationregistry.org) — Sean
 * Washington, Kevin Baker, and Anthony Ways, all wrongly convicted in
 * Camden, New Jersey. Xonorate doesn't represent them (isClient: false),
 * so they render with the spotlight/awareness badge. `impact` (family /
 * community narrative) is intentionally left unset here — per
 * src/lib/case-impact.ts that text is meant to be generated from
 * structured ImpactFacts via the admin impact tool, not hand-written, and
 * the sourced coverage for these three didn't document enough family/
 * community facts to populate that structure responsibly.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-camden-nre-cases.ts
 */
import { db } from "../src/db";
import { cases } from "../src/db/schema";

async function main() {
  await db.insert(cases).values([
    {
      clientName: "Sean Washington",
      slug: "sean-washington",
      summary:
        "Shortly before 6 a.m. on January 28, 1995, an unidentified caller reported finding two bodies in a pool of blood in Camden's Roosevelt Manor housing complex. Rodney Turner, 35, and Margaret Wilson, 40, had both been shot in the head. Five days later, based on street rumor, police arrested Sean Washington and Kevin Baker, then both 23, largely on the word of a single eyewitness, Denise Rand, who was high on crack cocaine at the time of the shooting and gave inconsistent, wavering testimony at trial. Washington and Baker were convicted after a two-day trial in August 1996 and sentenced to 60 years to life.\n\nWashington had in fact called 911 himself that morning after discovering the bodies while walking to a nearby pay phone, fearing one victim was his nephew — but that call went unidentified for 18 years. Beginning in 2011, the Last Resort Exoneration Project at Seton Hall Law School uncovered the 911 recording and new ballistics and forensic analysis showing both victims were shot at close range while on the ground, directly contradicting Rand's account of them being shot while running. In December 2019, the New Jersey Appellate Division unanimously vacated both convictions, finding the new evidence \"powerfully undermines\" Rand's testimony. Camden County prosecutors declined to retry the case, and Washington and Baker were released on February 11, 2020, after nearly 25 years in prison.",
      convictionDetails: {
        charge: "Murder, Conspiracy, Illegal Use of a Weapon",
        year: 1996,
        sentence: "60 years to life",
        contributingFactors:
          "The case rested on a single eyewitness, Denise Rand, who was under the influence of crack cocaine at the time of the shooting and gave inconsistent testimony at trial about what she saw and who she was with. Sergeant Washington's own 911 call reporting the bodies went unidentified for nearly two decades and was never turned over to the defense. His trial lawyer testified at a later hearing that he did very little to investigate Washington's account, never interviewed the witnesses Washington named, and never consulted a forensic pathologist or firearms expert.",
      },
      timeServed: "Nearly 25 years (arrested March 21, 1995 — released February 11, 2020)",
      exonerationDetails: {
        whatLedToExoneration:
          "Starting in 2011, the Last Resort Exoneration Project at Seton Hall Law School re-investigated the case and obtained the 911 call recording, which multiple witnesses identified as Washington's own voice reporting the bodies. Forensic pathologist Dr. Michael Baden and firearms expert Lucien Haag testified that bullet trajectories, ricochet \"bow effect\" scoring, and soil mineralization on the recovered bullets showed Wilson had been shot while lying on the ground — directly contradicting Rand's trial testimony that she saw the victims shot while standing and running. On December 26, 2019, the Appellate Division of the New Jersey Superior Court unanimously vacated both convictions, finding the new evidence \"powerfully undermines\" Rand's account. The Camden County Prosecutor's Office declined to retry the case, and a judge dismissed all charges on February 11, 2020. Washington later settled a state compensation claim for $1.25 million.",
        year: 2020,
      },
      status: "exonerated",
      state: "New Jersey",
      county: "Camden",
      raceEthnicity: "Black",
      sex: "Male",
      ageAtCrime: 23,
      contributingFactorTags: [
        "False or misleading forensic evidence",
        "Perjury or false accusation",
        "Inadequate legal defense",
      ],
      dnaInvolved: false,
      photoUrl: null,
      isClient: false,
      sourceUrl: "https://exonerationregistry.org/cases/12771",
      innocenceClaim: {
        stats: [
          { value: "25", label: "Years wrongly imprisoned" },
          { value: "18", label: "Years his own 911 call went unidentified" },
          { value: "$1.25M", label: "State compensation settlement" },
        ],
        pullQuote:
          "Our independent review of the record, in light of the newly discovered evidence, compels us to conclude it would be unjust to allow this verdict to stand.",
        categories: [
          {
            title: "Evidence of innocence",
            items: [
              {
                title: "Washington made the 911 call himself",
                body: "The unidentified 911 caller who reported finding the bodies was, in fact, Washington — he had gone to a nearby pay phone and spotted the victims on the way, fearing one was his nephew. Multiple witnesses later identified his voice on the recording, and his trial defense lawyer, once played the tape, said it was \"absolutely clear\" it was Washington.",
              },
              {
                title: "A corroborated alibi never presented to the jury",
                body: "Washington's cousin, Dwight Collins, testified at a post-conviction hearing that Washington was at his mother's house cooking chicken minutes before the shooting, left to use a pay phone, and returned \"very emotional\" and \"crying\" after seeing the bodies. Several other witnesses corroborated this account, but it was never presented to the original trial jury.",
              },
            ],
          },
          {
            title: "Newly discovered evidence",
            items: [
              {
                title: "Forensic reconstruction contradicted the eyewitness",
                body: "In 2013, prosecutors turned over discovery that included the 911 call for the first time. Forensic pathologist Dr. Michael Baden and firearms expert Lucien Haag later testified that bullet trajectories and \"bow effect\" ricochet scoring on the recovered bullets showed victim Margaret Wilson was shot while lying on the ground — directly contradicting eyewitness Denise Rand's account that she saw the victims shot while standing and fleeing.",
              },
              {
                title: "Statements undermining the eyewitness's credibility",
                body: "Two acquaintances of Denise Rand, both since deceased, gave statements that shortly after the 1996 trial, Rand told them she had not actually been present at or witnessed the murders.",
              },
            ],
          },
          {
            title: "Due-process violations",
            items: [
              {
                title: "Undocumented interrogation and photo identification",
                body: "Police interrogated witnesses Denise Rand and Tyrone Moore separately after an informant's tip, and the photo display procedure that led to Rand naming Washington and Baker was never documented.",
              },
              {
                title: "Inadequate trial defense",
                body: "Washington's trial attorney, Michael Kahn, later testified he did very little to investigate Washington's account: he never interviewed the witnesses Washington named, never determined a timeline of events, and never consulted a forensic pathologist, firearms examiner, or shooting-reconstruction expert.",
              },
            ],
          },
          {
            title: "Unreliable evidence",
            items: [
              {
                title: "Sole eyewitness was impaired and inconsistent",
                body: "The prosecution's own opening called it a \"one-witness case.\" Denise Rand admitted she had smoked crack cocaine roughly two hours before the shooting and typically smoked every two to three hours. Her trial testimony repeatedly changed on cross-examination, including who she was with, where they were standing, and which defendant she said shot which victim — she needed her own prior police statement read back to her to attribute the shootings at all.",
              },
              {
                title: "An unreliable polygraph used against a rival account",
                body: "Rand's cousin, Tyrone Moore, initially told police he and Rand were blocks away when they heard the shots — an account matching other witnesses. An uncredentialed polygraph examiner then issued a report concluding Moore was lying, which was used to discount his contradicting account. Rand herself was never given a polygraph.",
              },
            ],
          },
        ],
      },
    },
    {
      clientName: "Kevin Baker",
      slug: "kevin-baker",
      summary:
        "Shortly before 6 a.m. on January 28, 1995, an unidentified caller reported finding two bodies in a pool of blood in Camden's Roosevelt Manor housing complex. Rodney Turner, 35, and Margaret Wilson, 40, had both been shot in the head. Five days later, based on street rumor, police arrested Kevin Baker and Sean Washington, then both 23, largely on the word of a single eyewitness, Denise Rand, who was high on crack cocaine at the time of the shooting and gave inconsistent, wavering testimony at trial. Baker and Washington were convicted after a two-day trial in August 1996 and sentenced to 60 years to life.\n\nBaker maintained an alibi — that he was with his girlfriend, Michelle Redden, at her mother's home and then her apartment that night — but the lawyer never called Redden as a witness. In 2011, the Last Resort Exoneration Project at Seton Hall Law School began reinvestigating, eventually uncovering a 911 recording (made by Washington, not identified for 18 years) and new ballistics and forensic analysis showing both victims were shot at close range while on the ground, directly contradicting the eyewitness's account of them being shot while running. In December 2019, the New Jersey Appellate Division unanimously vacated both convictions, finding the new evidence \"powerfully undermines\" that testimony. Camden County prosecutors declined to retry the case, and Baker and Washington were released on February 11, 2020, after nearly 25 years in prison.",
      convictionDetails: {
        charge: "Murder, Conspiracy, Illegal Use of a Weapon",
        year: 1996,
        sentence: "60 years to life",
        contributingFactors:
          "The case rested on a single eyewitness, Denise Rand, who was under the influence of crack cocaine at the time of the shooting and gave inconsistent testimony at trial about what she saw and who she was with. Baker's alibi witness, his girlfriend Michelle Redden, was never called to testify — his trial lawyer said he doubted her \"general demeanor\" would read as truthful — and she died of cancer years before a court ever heard her account. A 2008 polygraph examiner for the Public Defender's Office found Baker had a \"high degree of confidence\" he was telling the truth when he denied any knowledge of the crime.",
      },
      timeServed: "Nearly 25 years (arrested February 15, 1995 — released February 11, 2020)",
      exonerationDetails: {
        whatLedToExoneration:
          "Starting in 2011, the Last Resort Exoneration Project at Seton Hall Law School re-investigated the case, eventually obtaining a 911 call recording that multiple witnesses identified as co-defendant Sean Washington's voice reporting the bodies — evidence never turned over to the defense at trial. Forensic pathologist Dr. Michael Baden and firearms expert Lucien Haag testified that bullet trajectories, ricochet \"bow effect\" scoring, and soil mineralization on the recovered bullets showed victim Margaret Wilson had been shot while lying on the ground — directly contradicting eyewitness Denise Rand's trial testimony that she saw the victims shot while standing and running. On December 26, 2019, the Appellate Division of the New Jersey Superior Court unanimously vacated both convictions, finding the new evidence \"powerfully undermines\" Rand's account. The Camden County Prosecutor's Office declined to retry the case, and a judge dismissed all charges on February 11, 2020. Baker later settled a state compensation claim for $1.25 million.",
        year: 2020,
      },
      status: "exonerated",
      state: "New Jersey",
      county: "Camden",
      raceEthnicity: "Black",
      sex: "Male",
      ageAtCrime: 23,
      contributingFactorTags: [
        "False or misleading forensic evidence",
        "Perjury or false accusation",
        "Inadequate legal defense",
      ],
      dnaInvolved: false,
      photoUrl: null,
      isClient: false,
      sourceUrl: "https://exonerationregistry.org/cases/12770",
      innocenceClaim: {
        stats: [
          { value: "25", label: "Years wrongly imprisoned" },
          { value: "8", label: "Years offered in a plea deal Baker refused" },
          { value: "$1.25M", label: "State compensation settlement" },
        ],
        pullQuote: "It shouldn't have been this hard to get out.",
        categories: [
          {
            title: "Evidence of innocence",
            items: [
              {
                title: "An alibi corroborated by his girlfriend",
                body: "Baker testified he was with his girlfriend, Michelle Redden, at her mother's home in Roosevelt Manor until about 2 a.m., then at her apartment across town for the rest of the night. Redden had told police and Baker's own trial lawyer the same account before she died of cancer years before a court could hear her testimony.",
              },
              {
                title: "He refused a plea deal rather than falsely implicate his co-defendant",
                body: "Baker testified that prosecutors offered him a deal — plead guilty and testify against Washington in exchange for an eight-year sentence. He rejected it, saying he did not know anything about the shootings. He instead served roughly 25 years maintaining his innocence.",
              },
              {
                title: "A 2008 polygraph examination supported his account",
                body: "Vinson Montgomery, a polygraph examiner for the Public Defender's Office, testified he gave Baker a polygraph examination in 2008 and had a \"high degree of confidence\" Baker was telling the truth when he denied any knowledge of the crime.",
              },
            ],
          },
          {
            title: "Newly discovered evidence",
            items: [
              {
                title: "Forensic reconstruction contradicted the eyewitness",
                body: "In 2013, prosecutors turned over discovery that included a 911 call for the first time, later identified as co-defendant Sean Washington's voice. Forensic pathologist Dr. Michael Baden and firearms expert Lucien Haag later testified that bullet trajectories and \"bow effect\" ricochet scoring on the recovered bullets showed victim Margaret Wilson was shot while lying on the ground — directly contradicting eyewitness Denise Rand's account that she saw the victims shot while standing and fleeing.",
              },
              {
                title: "Statements undermining the eyewitness's credibility",
                body: "Two acquaintances of Denise Rand, both since deceased, gave statements that shortly after the 1996 trial, Rand told them she had not actually been present at or witnessed the murders.",
              },
            ],
          },
          {
            title: "Due-process violations",
            items: [
              {
                title: "Alibi witness never called at trial",
                body: "Baker's trial defense attorney, Frederick Gumminger, did not call Michelle Redden as an alibi witness, later testifying he doubted her \"general demeanor\" would read as truthful to a jury — despite recently discovered news footage that corroborated Redden's account of watching televised coverage of the murders with Baker.",
              },
              {
                title: "Undocumented interrogation and photo identification",
                body: "Police interrogated witnesses Denise Rand and Tyrone Moore separately after an informant's tip, and the photo display procedure that led to Rand naming Baker and Washington was never documented.",
              },
            ],
          },
          {
            title: "Unreliable evidence",
            items: [
              {
                title: "Sole eyewitness was impaired and inconsistent",
                body: "The prosecution's own opening called it a \"one-witness case.\" Denise Rand admitted she had smoked crack cocaine roughly two hours before the shooting and typically smoked every two to three hours. Her trial testimony repeatedly changed on cross-examination, including who she was with, where they were standing, and which defendant she said shot which victim — she needed her own prior police statement read back to her to attribute the shootings at all.",
              },
              {
                title: "An unreliable polygraph used against a rival account",
                body: "Rand's cousin, Tyrone Moore, initially told police he and Rand were blocks away when they heard the shots — an account matching other witnesses. An uncredentialed polygraph examiner then issued a report concluding Moore was lying, which was used to discount his contradicting account. Rand herself was never given a polygraph.",
              },
            ],
          },
        ],
      },
    },
    {
      clientName: "Anthony Ways",
      slug: "anthony-ways",
      summary:
        "Shortly after midnight on April 23, 1989, Wayne Hunter drove John Weist III, 20, into Camden, New Jersey to buy cocaine. When they stopped at a corner Weist directed him to, a man approached, demanded money, and fired a pistol through the car window as they sped off, killing Weist. Police showed Hunter — who was near-sighted and not wearing his glasses that night — a photo lineup, and he picked out 19-year-old Anthony Ways, the only person in the lineup wearing a hat. Ways, known as \"Mancakes\" and the leader of a local street gang, was arrested two days later. A cocaine addict, Donna Carter, later told police she saw Ways and another man, Bryant Anderson, approach the car; at trial she recanted and testified only Ways was there and that he fired the shot. A jury acquitted Anderson but convicted Ways of murder, robbery, and weapons charges in September 1991, and he was sentenced to life.\n\nWays always maintained the shooting happened at a different bar two blocks away, and that the real shooter was a man named Franklin King, who was known to carry the same caliber weapon and who — on separate occasions, to at least three different people, including Ways's own cousin — admitted to shooting Weist. At a 2000 post-conviction hearing, multiple witnesses recanted or corroborated the alternate account. In 2004, the New Jersey Supreme Court reversed his conviction and ordered a new trial, finding the new evidence \"sufficiently implicated King in the shooting\" that it likely would have led to an acquittal. Rather than face a retrial, prosecutors dismissed the murder charges in October 2005 after Ways pleaded guilty to lesser charges of witness tampering and hindering apprehension; he was sentenced to time already served. He had spent 14 years in prison.",
      convictionDetails: {
        charge: "Murder, Robbery, Illegal Use of a Weapon",
        year: 1991,
        sentence: "Life",
        contributingFactors:
          "The conviction rested on a single eyewitness, driver Wayne Hunter, who was near-sighted, not wearing his glasses the night of the shooting, and picked Ways out of a photo lineup in which Ways was the only person wearing a hat — matching Hunter's vague description of the shooter's clothing. A second witness, Donna Carter, changed her story between her initial police statement and her trial testimony, and later testified at a post-conviction hearing that she had been coached by the prosecutor and that police had let her keep cocaine they had planted on her in exchange for her cooperation. Meanwhile a named alternate suspect, Franklin King, matched the type of weapon used and repeatedly admitted to others that he was the shooter.",
      },
      timeServed: "14 years (arrested April 25, 1989 — released on bond June 2004; charges dismissed October 19, 2005)",
      exonerationDetails: {
        whatLedToExoneration:
          "At a 2000 post-conviction hearing, several witnesses gave new or recanted testimony: Tyrone Williams said Franklin King had tried to sell him a .44 Magnum hours after the murder and admitted having \"a body on the gun\"; Donna Carter recanted her trial testimony, saying she had falsely implicated Ways because she was high, afraid of being charged, and had been coached by the prosecutor; alibi witness Todd Johnson admitted he had falsely placed Ways at a bar that night; a retired Camden police officer testified King had told him, before any gun evidence was public, \"I'm not the only one in Camden with a .44 Magnum\"; and Ways's own cousin testified King twice admitted to him, in prison, that he shot Weist. King himself testified at the hearing that Ways was innocent — \"someone else did it. It wasn't this guy\" — while denying he was the shooter. In 2004, the New Jersey Supreme Court reversed Ways's conviction, finding the new evidence \"sufficiently implicated King in the shooting\" that it likely would have led to Ways's acquittal at trial. Rather than face a retrial, Camden County prosecutors dismissed the murder, robbery, and weapons charges in October 2005 after Ways pleaded guilty to unrelated witness-tampering and hindering-apprehension charges, for which he was sentenced to time served. He settled a wrongful-conviction lawsuit for $280,000 in 2008 and has since advocated for other wrongfully convicted people, including serving on the advisory committee for an innocence project at Rutgers University.",
        year: 2005,
      },
      status: "exonerated",
      state: "New Jersey",
      county: "Camden",
      raceEthnicity: "Black",
      sex: "Male",
      ageAtCrime: 19,
      contributingFactorTags: [
        "Mistaken witness identification",
        "Perjury or false accusation",
        "Official misconduct",
      ],
      dnaInvolved: false,
      photoUrl: null,
      isClient: false,
      sourceUrl: "https://exonerationregistry.org/cases/11914",
      innocenceClaim: {
        stats: [
          { value: "14", label: "Years wrongly imprisoned" },
          { value: "$280K", label: "Wrongful-conviction lawsuit settlement (2008)" },
        ],
        pullQuote: "Someone else did it. It wasn't this guy.",
        categories: [
          {
            title: "Evidence of innocence",
            items: [
              {
                title: "A named alternate suspect who repeatedly admitted guilt",
                body: "Franklin King, who matched the type of weapon used in the killing, admitted on separate occasions to at least three different people — including Ways's own cousin, while both were incarcerated together — that he had shot Weist. At Ways's 2000 post-conviction hearing, King testified under oath that Ways was innocent: \"someone else did it. It wasn't this guy.\"",
              },
              {
                title: "The crime scene didn't match the state's theory",
                body: "The defense contended the shooting actually happened at Wally's Bar, two blocks from the Time and Place Lounge the state pointed to — and unlike the lounge, Wally's Bar was next to an alley, matching driver Wayne Hunter's own description of the scene.",
              },
            ],
          },
          {
            title: "Newly discovered evidence",
            items: [
              {
                title: "A buyer King approached with the murder weapon",
                body: "At the 2000 hearing, Tyrone Williams testified that in the hours after the killing, Franklin King asked him if he wanted to buy a .44 Magnum pistol, and when asked if it had \"any bodies on the gun,\" King said yes and opened the cylinder to show a spent shell.",
              },
              {
                title: "A retired officer's early tip pointed to King",
                body: "Leonard Hall, a retired Camden police officer, testified that shortly after the murder, before any gun evidence was public, King stated in his presence, \"I'm not the only one in Camden with a .44 Magnum.\" Hall reported King to police as a possible suspect at the time.",
              },
              {
                title: "The state's key witness recanted",
                body: "Donna Carter, whose trial testimony that Ways alone was the shooter helped convict him, later testified she had falsely incriminated him because she was high and afraid of being charged with drug and prostitution offenses, and that a prosecutor had told her what to say.",
              },
            ],
          },
          {
            title: "Due-process violations",
            items: [
              {
                title: "Alleged evidence-planting to secure cooperation",
                body: "Donna Carter testified at the post-conviction hearing that Camden police officers planted eight bags of cocaine on her before she spoke with the prosecutor, then let her keep the drugs afterward — presumably in exchange for her cooperation implicating Ways.",
              },
              {
                title: "A recanted alibi witness",
                body: "Todd Johnson, who testified at trial that he saw Ways at the Time and Place Lounge around the time of the shooting, later admitted at the post-conviction hearing that he had falsely testified, believing at the time he was helping provide Ways an alibi.",
              },
            ],
          },
          {
            title: "Unreliable evidence",
            items: [
              {
                title: "A cross-racial identification made without glasses",
                body: "The sole eyewitness, driver Wayne Hunter, was near-sighted and was not wearing his glasses on the night of the shooting. He identified Ways from a photo lineup in which Ways was the only person wearing a hat — matching Hunter's vague description of the shooter's clothing.",
              },
              {
                title: "A recanting witness who changed her account for the jury",
                body: "Donna Carter initially told police she saw both Ways and Bryant Anderson approach the car, with Anderson identified as the one who fired. At trial, she reversed course and testified only Ways was present and that he was the shooter — the recantation that helped convict him but that she later disavowed as coerced.",
              },
            ],
          },
        ],
      },
    },
  ]);

  console.log("Inserted Sean Washington, Kevin Baker, and Anthony Ways cases.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
