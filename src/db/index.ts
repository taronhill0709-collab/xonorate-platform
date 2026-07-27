import { getConnectionString } from "@netlify/database";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// getConnectionString() resolves to the right database branch
// automatically (production vs. deploy-preview) when running under
// `netlify dev` or a Netlify deploy. DATABASE_URL is a manual override
// for environments where the Netlify CLI isn't driving the process.
//
// Uses the standard Postgres wire protocol (via `pg`) rather than Neon's
// HTTP driver: `netlify dev`'s local database is a real local Postgres
// instance, not a Neon HTTPS endpoint, and node-postgres works against
// both that and production Neon.
//
// This connects eagerly at import time. Build and dev must run through
// the Netlify CLI (`netlify build` / `netlify dev`, both wired up in
// package.json) so the connection string is injected — a bare `next
// build`/`next dev` outside that wrapper won't have it.
const connectionString = process.env.DATABASE_URL ?? getConnectionString();

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });
