// Mirrors the newest drizzle-kit-generated migration in drizzle/ into
// netlify/database/migrations/, which is what `netlify database migrations
// apply` (npm run db:migrate) actually reads. drizzle-kit and the Netlify
// CLI each need their own migration format/location — this script doesn't
// try to unify them, it just makes the required copy step a single command
// instead of a manual, easy-to-forget one.
//
// Usage: npm run db:sync-migration -- <slug-for-the-netlify-folder-name>
// Run this immediately after `npm run db:generate`.
//
// Tracks what's already been synced in drizzle/.synced-migrations (one
// drizzle tag per line) so re-running without a new drizzle migration, or
// forgetting to sync one before generating the next, fails loudly instead
// of silently drifting — see the migration-drift issue this replaces.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DRIZZLE_DIR = path.join(ROOT, "drizzle");
const NETLIFY_DIR = path.join(ROOT, "netlify", "database", "migrations");
const SYNCED_MANIFEST = path.join(DRIZZLE_DIR, ".synced-migrations");

function readSyncedTags(): string[] {
  if (!existsSync(SYNCED_MANIFEST)) return [];
  return readFileSync(SYNCED_MANIFEST, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function drizzleMigrationTags(): string[] {
  return readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.replace(/\.sql$/, ""))
    .sort();
}

function nextNetlifyIndex(): number {
  if (!existsSync(NETLIFY_DIR)) return 1;
  const indexes = readdirSync(NETLIFY_DIR)
    .map((name) => parseInt(name.slice(0, 4), 10))
    .filter((n) => !Number.isNaN(n));
  return indexes.length === 0 ? 1 : Math.max(...indexes) + 1;
}

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error(
      "Usage: npm run db:sync-migration -- <slug>\n" +
        "  e.g. npm run db:sync-migration -- add-xonorate-family-tables",
    );
    process.exit(1);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error("Slug must be lowercase letters, digits, and hyphens only.");
    process.exit(1);
  }

  const allTags = drizzleMigrationTags();
  const synced = new Set(readSyncedTags());
  const pending = allTags.filter((tag) => !synced.has(tag));

  if (pending.length === 0) {
    console.error(
      "No unsynced drizzle migrations found. Did you run `npm run db:generate` first?",
    );
    process.exit(1);
  }
  if (pending.length > 1) {
    console.error(
      `Found ${pending.length} unsynced drizzle migrations (${pending.join(", ")}).\n` +
        "Sync them one at a time, oldest first, so each gets its own netlify migration folder.",
    );
    process.exit(1);
  }

  const [tag] = pending;
  const sql = readFileSync(path.join(DRIZZLE_DIR, `${tag}.sql`), "utf8");

  const index = nextNetlifyIndex();
  const folderName = `${String(index).padStart(4, "0")}_${slug}`;
  const folderPath = path.join(NETLIFY_DIR, folderName);

  if (existsSync(folderPath)) {
    console.error(`${folderPath} already exists — pick a different slug.`);
    process.exit(1);
  }

  mkdirSync(folderPath, { recursive: true });
  writeFileSync(path.join(folderPath, "migration.sql"), sql);
  writeFileSync(SYNCED_MANIFEST, [...synced, tag].sort().join("\n") + "\n");

  console.log(`Synced drizzle/${tag}.sql -> netlify/database/migrations/${folderName}/migration.sql`);
}

main();
