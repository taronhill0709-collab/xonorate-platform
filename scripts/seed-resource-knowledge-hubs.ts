/**
 * One-off: seeds the first Resource Center knowledge-hub batch (10
 * priority wrongful-conviction topics). See
 * src/lib/resource-knowledge-hub-seed-data.ts for the actual seed content
 * (shared with the one-time production migration route) — this script is
 * just the manual/local runner for it.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-resource-knowledge-hubs.ts
 */
import { seedResourceKnowledgeHubs } from "../src/lib/resource-knowledge-hub-seed-data";

seedResourceKnowledgeHubs()
  .then((count) => {
    console.log(`Seeded ${count} resource knowledge hubs.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
