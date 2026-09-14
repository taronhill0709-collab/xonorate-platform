/**
 * One-off: migrates every resource from the old static `/resources` page
 * into the new `resources` table. See src/lib/resource-seed-data.ts for the
 * actual seed content (shared with the one-time production migration
 * route) — this script is just the manual/local runner for it.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `.netlify/state.json` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/seed-resources.ts
 */
import { seedResources } from "../src/lib/resource-seed-data";

seedResources()
  .then((count) => {
    console.log(`Seeded ${count} resources.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
