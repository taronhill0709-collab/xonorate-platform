/**
 * One-off: seeds the Xonorate Foundational Knowledge Library. See
 * src/lib/knowledge-source-seed-data.ts for the actual seed content (shared
 * with the one-time production migration route) — this script is just the
 * manual/local runner for it.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-knowledge-sources.ts
 */
import { seedKnowledgeSources } from "../src/lib/knowledge-source-seed-data";

seedKnowledgeSources()
  .then((count) => {
    console.log(`Seeded ${count} knowledge sources.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
