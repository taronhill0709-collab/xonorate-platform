/**
 * One-off: adds the Jeff Abramowski spotlight case (not a Xonorate client —
 * isClient: false) directly, bypassing the admin form's photo upload since
 * no photo exists yet.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-abramowski-case.ts
 */
import { db } from "../src/db";
import { cases } from "../src/db/schema";

async function main() {
  await db.insert(cases).values({
    clientName: "Jeff Abramowski",
    slug: "jeff-abramowski",
    summary:
      "Jeff (Jeffrey) Abramowski spent 23 years in prison for the May 19, 2002 murder of his friend Cortney \"Dick\" Crandall in Palm Shores, Florida — convicted largely on DNA found under the victim's fingernails. New private DNA testing on the murder weapons in 2025 revealed two unknown male DNA profiles, one of which excluded Abramowski. He was released April 18, 2025, and Florida later dropped the charges rather than pursue a retrial.",
    convictionDetails: {
      charge: "Second-degree murder",
      year: 2006,
      sentence: "Life",
      contributingFactors:
        "Prosecutors' case relied on DNA found under the victim's fingernails.",
    },
    timeServed: "23 years",
    exonerationDetails: {
      whatLedToExoneration:
        "New private DNA testing on the murder weapons revealed two unknown male DNA profiles, one of which excluded Abramowski. Attorney Kevin McCann worked the case pro bono for six years after it was featured on FLORIDA TODAY's \"Murder on the Space Coast\" podcast (Season 4). The State Attorney did not oppose the motion to vacate. Abramowski was released April 18, 2025, and the state later announced it would not pursue a retrial, fully dropping the charges.",
      year: 2025,
    },
    status: "exonerated",
    state: "Melbourne, Florida (Brevard County)",
    isClient: false,
    photoUrl: null,
  });

  console.log("Inserted Jeff Abramowski spotlight case.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
