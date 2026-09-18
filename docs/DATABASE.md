# Database

Drizzle ORM + Postgres (Neon, via Netlify Database). Single schema entry
point at `src/db/schema.ts`, which drizzle-kit is configured against
(`drizzle.config.ts`). The Family tables live in `src/family/db-schema.ts`
and are re-exported with `export * from "@/family/db-schema"` at the end of
`schema.ts` — kept in their own file since Family is its own product
domain, without splitting drizzle-kit's single entry point.

## Xonorate Family tables

`families`, `familyMembers`, `lovedOnes`, `facilities`, `familyCalendarEvents`,
`familyDocuments`, `familyNotes`, `supportPeople`, `auditLog`, and
`timelineEvents` (the one table with no UI yet — no CRUD exists for the
loved-one Journey/timeline; that's Phase 2's document-extraction work,
per the approved plan's phasing).
See the comments in `src/family/db-schema.ts` for
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
  `next:dev` with a placeholder `DATABASE_URL` set only for that one shell
  session (e.g. `DATABASE_URL=postgres://placeholder/placeholder npm run
  next:dev`) — **never** as a persisted `.env.development.local` file.
  An earlier version of this note claimed `.env.development.local` was
  safe because Next's dotenv loader never overrides an existing
  `process.env` value — that's true for plain `next dev`, but **`netlify
  dev` itself also reads and injects `.env.development.local`** (visible
  in its own startup log: `Injected .env.development.local file env
  vars: DATABASE_URL`), and it does so as if that were the real
  connection string, silently replacing the actual local Postgres
  connection `netlify dev` would otherwise provision. This broke `netlify
  dev` outright during this project's first live-database verification
  pass (see below) — the file has been deleted. Use an inline env var for
  a single command instead of a file that persists across sessions.

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

### Live verification, and a sandbox-specific limitation

`npm run test:db`'s `vitest` process cannot reach this sandbox's local
`netlify dev` database directly: `netlify dev` provisions its local
Postgres on an ephemeral high port reachable only from *inside* the dev
server's own process (confirmed — the exact working connection string,
used from an external `vitest` invocation, gets `ECONNREFUSED`). This
appears specific to how this sandbox isolates that process, not a property
of `vitest` or the connection string itself.

To still verify the authorization guarantees against a real, live
database rather than only via `describe.skipIf`, a temporary diagnostic
route (added under `src/app/api/`, deleted immediately after, never
committed) ran the same assertions as the `*.integration.test.ts` suite
*from inside* the running dev server process, using the real
`src/family/*.ts` functions. Getting there also surfaced and fixed two
real things:

1. The `netlify database migrations apply` path is currently wedged on
   this local dev database by a pre-existing, unrelated drift issue (a
   `site_settings` column that already exists) that predates Family
   entirely — see the original architecture audit. This blocks the whole
   migration batch, including Family's, from applying through the normal
   path. Worked around for this session by applying the Family migration
   SQL directly; **the underlying wedge is still unresolved** and blocks
   local `netlify dev` from fully working (it also breaks the site's own
   homepage locally, which depends on a later-blocked migration).
2. The `.env.development.local` bug described above.

Twelve of thirteen checks passed live: cross-family isolation for loved
ones, calendar events, documents, and support people; private-note
invisibility to another active family member; and the invite
email-mismatch rejection. The one failure was a bug in the throwaway
script itself (it reused one test user as both an already-active member
and a separate invite's acceptor, correctly triggering the
`family_members_family_user_unique` constraint) — not a defect, and not
a scenario the real `invites.integration.test.ts` constructs.

**Still not verified live**: the document vault's actual upload → Netlify
Blobs → download round trip (the cross-family *guard* is covered; the
happy path needs real Blobs credentials, which weren't exercised here).
