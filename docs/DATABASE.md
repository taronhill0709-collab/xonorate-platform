# Database

Drizzle ORM + Postgres (Neon, via Netlify Database). Single schema entry
point at `src/db/schema.ts`, which drizzle-kit is configured against
(`drizzle.config.ts`). The Family tables live in `src/family/db-schema.ts`
and are re-exported with `export * from "@/family/db-schema"` at the end of
`schema.ts` — kept in their own file since Family is its own product
domain, without splitting drizzle-kit's single entry point.

## Xonorate Family tables

`families`, `familyMembers`, `lovedOnes`, `facilities`, `timelineEvents`
(not yet used by any UI), `familyDocuments` (not yet used), `familyNotes`
(not yet used), `supportPeople` (not yet used), `familyCalendarEvents` (not
yet used), `auditLog`. See the comments in `src/family/db-schema.ts` for
per-table rationale. Two decisions worth calling out:

- **`familyMembers` is the access-control table, not `users.role`.**
  `users.role` stays exactly the site-wide `supporter`/`admin` distinction
  it already was. A user's access to a specific family's data is entirely
  determined by an **active** `familyMembers` row — see `src/family/authz.ts`.
- **`facilities` is a shared lookup, not owned by a family.** Phase 1 has
  no facility-admin UI yet, so `src/family/facility.ts`'s `resolveFacility()`
  matches an existing facility by name+state (case-insensitive) or creates
  a minimal, `verified: false` row on the fly from a loved-one's profile
  form. A future facility-admin surface can enrich/verify these rows
  without changing this function's contract.

## Migration drift — now tooled, not manual

This repo maintains two migration folders that must independently stay in
sync: `drizzle/` (drizzle-kit's own format, read by `drizzle-kit generate`
studio/push) and `netlify/database/migrations/` (the format
`netlify database migrations apply` / `npm run db:migrate` actually reads
against the deployed database). These have drifted silently before.

The process is now:

```bash
npm run db:generate                          # unchanged — writes drizzle/NNNN_name.sql
npm run db:sync-migration -- some-slug       # new — mirrors it into netlify/database/migrations/
```

`scripts/sync-migration.ts` tracks what's already been mirrored in
`drizzle/.synced-migrations` (one drizzle-kit tag per line, gitignored-free
— it **is** committed, since it's the ledger the script relies on) and
fails loudly rather than silently drifting:

- Running `db:sync-migration` with nothing new generated errors ("did you
  run `db:generate` first?").
- Running it with more than one unsynced migration pending errors, asking
  you to sync them one at a time in order.
- Re-running it after a successful sync (nothing new pending) errors the
  same way as the first case — it never silently no-ops in a way that
  could mask a forgotten `db:generate`.

This does not unify the two folders — `drizzle-kit` and the Netlify CLI
each need their own format/location, and collapsing them (e.g. via a
symlink) would be a bigger, riskier change than the drift problem
justifies. If drift is ever suspected again, diff the tail of both folders
by content (not filename — they're numbered/named differently) the same
way the original architecture audit did.

## Local development

`src/db/index.ts` connects eagerly at import time via
`@netlify/database`'s `getConnectionString()`, which only resolves inside
`netlify dev` or an actual Netlify deploy — **not** plain `next dev`. This
means:

- Real functional testing (creating a family, inviting a member, etc.)
  requires `netlify dev` (`npm run dev`), which in this project's sandbox
  has a known reliability problem (a second `netlify` CLI invocation tends
  to crash a running `netlify dev`).
- **Visual-only** work (no real data) can run under plain `next dev`/
  `next:dev` if a gitignored `.env.development.local` sets a placeholder
  `DATABASE_URL` — see that file's own header comment. Next.js's dotenv
  loader never overrides a value already present in `process.env`, so this
  has no effect on `netlify dev` (which injects a real connection string
  itself) or on production. Any actual query against the placeholder will
  fail; this only unblocks pages/components that don't need real data to
  render.

## Authorization testing

`src/family/*.integration.test.ts` files run against a real database via
`DATABASE_URL` (same override `src/db/index.ts` already supports) and are
skipped automatically when it's unset (`describe.skipIf(!process.env.DATABASE_URL)`),
so `npm run test` stays green without a database. Run them for real with:

```bash
DATABASE_URL=postgres://... npm run test:db
```

Every new family-scoped resource type gets its own cross-family-isolation
test here before being considered done — see `authz.integration.test.ts`,
`invites.integration.test.ts`, and `loved-ones.integration.test.ts` for the
pattern: create two families, assert a caller/resource in one can never be
read, updated, or deleted through the other.
