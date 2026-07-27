import { getConnectionString } from "@netlify/database";
import { defineConfig } from "drizzle-kit";

// `generate` only reads schema.ts and never connects, so a missing/placeholder
// connection string is fine there. `push`/`studio` need a real one — run those
// via `netlify dev` (or set DATABASE_URL) so getConnectionString() can resolve it.
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  try {
    connectionString = getConnectionString();
  } catch {
    connectionString = "postgres://placeholder/placeholder";
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  strict: true,
  verbose: true,
});
