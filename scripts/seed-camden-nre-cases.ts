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
 * Case data lives in src/lib/seed-data/camden-nre-cases.ts, shared with the
 * temporary production seed route (src/app/api/admin/seed-camden-cases/).
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-camden-nre-cases.ts
 */
import { db } from "../src/db";
import { cases } from "../src/db/schema";
import { CAMDEN_NRE_CASES } from "../src/lib/seed-data/camden-nre-cases";

async function main() {
  await db.insert(cases).values(CAMDEN_NRE_CASES);
  console.log("Inserted Sean Washington, Kevin Baker, and Anthony Ways cases.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
