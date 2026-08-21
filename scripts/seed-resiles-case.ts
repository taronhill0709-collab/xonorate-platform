/**
 * One-off: adds the Dayonte Resiles client case and its source documents
 * directly, bypassing the admin form's photo upload since no photo exists
 * yet.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-resiles-case.ts
 */
import { db } from "../src/db";
import { caseDocuments, cases } from "../src/db/schema";

async function main() {
  const [row] = await db
    .insert(cases)
    .values({
      clientName: "Dayonte Resiles",
      slug: "dayonte-resiles",
      summary:
        "Jill Halliburton Su was found dead in her Davie, Florida home on September 8, 2014, bound and stabbed in a bathtub. Nine days later, a DNA database search returned the name of Dayonte Resiles, then twenty years old, with no known connection to the victim or her family. He was arrested the following day.\n\nThe State's case rested on DNA. Prosecutors told jurors that Mr. Resiles' DNA was recovered from items at the scene and that this established he was the killer. The defense argued throughout that a DNA association does not establish who committed a homicide, when the DNA was deposited, or how it got there.\n\nHis first trial ended in a mistrial in December 2021 under extraordinary circumstances: the jury returned a manslaughter verdict, and when jurors were polled, one said she did not agree with it. Following the mistrial, a juror stated that some jurors had been unwilling to convict on the greater charge because of his race. A retrial three months later produced a first-degree murder conviction. The Fourth District Court of Appeal affirmed in a one-word per curiam opinion in January 2025.\n\nMr. Resiles has maintained his innocence for twelve years, including in a letter to the court and in open court at his own sentencing. Xonorate is supporting his request for independent post-conviction review.",
      convictionDetails: {
        charge: "First-degree murder and related counts",
        year: 2022,
        sentence: "Life without parole",
        contributingFactors:
          "The conviction rests almost entirely on DNA evidence attributed to Mr. Resiles following a database search nine days after the killing. No independently reviewed DNA case file has been produced beyond summary lab reports. In a letter to the court, Mr. Resiles states that physical evidence recovered from the scene was never tested and that the timeline presented to the jury was never reconciled with available electronic records. WSVN reported that a juror in the case that ended in mistrial stated afterward that some jurors would not convict on the greater charge because of Mr. Resiles' race.",
      },
      timeServed: "~11 years, 11 months — continuously in custody since September 2014",
      exonerationDetails: null,
      status: "active_case",
      state: "Davie, Florida (Broward County)",
      isClient: true,
      photoUrl: null,
      innocenceClaim: {
        stats: [],
        pullQuote: "",
        categories: [
          {
            title: "Due-process violations",
            items: [
              {
                title: "Investigative tunnel vision following a database hit",
                body: "Before the DNA database returned his name, investigators were working an open homicide with other avenues under active consideration, according to Mr. Resiles' letter to the court. NIST IR 8503 (2024), Recommendation 5.1, warns that database associations can occur with individuals who are not the source of the DNA and directs laboratories to communicate that limitation to investigators precisely because of the tunnel-vision risk. Whether that limitation was communicated in this case has not been independently documented.",
              },
              {
                title: "Untested physical evidence",
                body: "According to Mr. Resiles' letter to the court, items recovered from the scene were never subjected to DNA testing, and surfaces probative of who was present and who handled equipment inside the residence were never swabbed.",
              },
              {
                title: "Incomplete timeline investigation",
                body: "According to Mr. Resiles' letter to the court, objective, electronically timestamped records bearing on when the homicide occurred were never obtained by the State. He states that utility usage records from the residence reflect a continuous water event on the morning of the killing that has never been reconciled with the timeline presented to the jury.",
              },
              {
                title: "Racial bias raised in jury deliberations",
                body: "WSVN reported that after the December 2021 mistrial, a juror stated that some jurors had declined to convict on the greater charge because of Mr. Resiles' race.",
              },
            ],
          },
          {
            title: "Unreliable evidence",
            items: [
              {
                title: "Disputed forensic DNA evidence",
                body: "The conviction rests almost entirely on DNA attributed to Mr. Resiles. A DNA association does not establish when material was deposited, how, whether by direct or indirect transfer, or what activity produced it. The defense challenged the interpretation methodology at trial, including the statistical calculations used to attribute the profiles. Independent review of the complete DNA case file — electropherograms, quantitation data, bench notes, controls, chain-of-custody records, not just summary reports — has never been completed.",
              },
              {
                title: "Prejudicial flight evidence",
                body: 'In July 2016, awaiting trial, Mr. Resiles escaped from the Broward County Courthouse and was recaptured after six days. Prosecutors used the escape at trial as consciousness-of-guilt evidence and the escape video was played for the retrial jury. After recapture he wrote to the court stating he fled because he is innocent. He has never disputed the escape itself.',
              },
            ],
          },
        ],
      },
    })
    .returning({ id: cases.id });

  await db.insert(caseDocuments).values([
    {
      caseId: row.id,
      title: "Resiles v. State, Fourth DCA opinion (Jan. 16, 2025)",
      status: "on_file",
      fileUrl:
        "https://cases.justia.com/florida/fourth-district-court-of-appeal/2025-4d2022-1557.pdf",
      sortOrder: 0,
    },
    {
      caseId: row.id,
      title: "NBC6 — Jury finds Resiles guilty (Mar. 2022)",
      status: "on_file",
      fileUrl:
        "https://www.nbcmiami.com/news/local/dayonte-resiles-found-guilty-of-murdering-woman-in-davie-home-in-2014/2716810/",
      sortOrder: 1,
    },
    {
      caseId: row.id,
      title: "CBS News Miami — Death penalty dropped, life sentence mandatory",
      status: "on_file",
      fileUrl: "https://cbsnews.com/miami/news/death-penalty-dropped-dayonte-resiles-jill-halliburton-su",
      sortOrder: 2,
    },
    {
      caseId: row.id,
      title: "CBS News — First trial ends in mistrial after juror disagreement",
      status: "on_file",
      fileUrl: "https://www.cbsnews.com/news/dayonte-resiles-trial-juror-manslaughter-verdict-fort-lauderdale/",
      sortOrder: 3,
    },
    {
      caseId: row.id,
      title: "WSVN — Sentencing coverage, including juror's statement on race",
      status: "on_file",
      fileUrl:
        "https://wsvn.com/news/local/broward/dayonte-resiles-sentenced-to-life-in-prison-for-2014-murder-of-davie-woman/",
      sortOrder: 4,
    },
    {
      caseId: row.id,
      title: "Local10 — DNA testimony and defense challenge at trial",
      status: "on_file",
      fileUrl: "https://www.local10.com/news/local/2021/11/30/resiles-murder-trial-resumes-with-testimony-over-dna/",
      sortOrder: 5,
    },
  ]);

  console.log("Inserted Dayonte Resiles case and sources.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
