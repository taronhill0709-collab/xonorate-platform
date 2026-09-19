# Database

Drizzle ORM + Postgres (Neon, via Netlify Database). Single schema entry
point at `src/db/schema.ts`, which drizzle-kit is configured against
(`drizzle.config.ts`). The Family tables live in `src/family/db-schema.ts`
and are re-exported with `export * from "@/family/db-schema"` at the end of
`schema.ts` — kept in their own file since Family is its own product
domain, without splitting drizzle-kit's single entry point.

## Xonorate Family tables

`families`, `familyMembers`, `lovedOnes`, `facilities`, `familyCalendarEvents`,
`familyDocuments`, `familyNotes`, `supportPeople`, `supportLetters`,
`supportLetterRequests`, `auditLog`, and `timelineEvents` (the one table
with no UI yet — no CRUD exists for the loved-one Journey/timeline;
that's tied to Case Organizer's document-extraction work, per the
approved plan's phasing).
See the comments in `src/family/db-schema.ts` for
per-table rationale. Three decisions worth calling out:

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
- **`supportLetters` keeps `draftContent` and `finalContent` separate**
  rather than one mutable `content` column. `draftContent` is always
  exactly what the AI last produced; `finalContent` is the author's own
  edited version, null until they've actually changed something.
  `getLetterContent()` (in `support-letters-types.ts`) picks whichever
  exists, preferring `finalContent` — which is why
  `regenerateSupportLetterDraft` explicitly clears `finalContent` back to
  null whenever it writes a fresh `draftContent`: otherwise the author's
  old edited version would keep winning and "Regenerate" would silently
  appear to do nothing. The client warns before calling it if a draft
  already exists (`letter-workflow.tsx`), since regenerating is
  destructive to any edits made so far.
- **`supportLetterRequests` is a separate table from `supportLetters`,
  not a nullable-`authorUserId` variant of it.** The invitee has no
  Xonorate account, so there's no `users` row to reference — the same
  `draftContent`/`finalContent`/answers lifecycle lives directly on the
  request row instead. Once approved, it's displayed alongside real
  `supportLetters` rows by merging both queries at the presentation layer
  (`letters/page.tsx`), not by unifying them into one table.

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

1. The `netlify database migrations apply` path was wedged on this local
   dev database by a pre-existing, unrelated drift issue that predates
   Family entirely — see the original architecture audit. **Now fixed**;
   see "The migration ledger gap" below for the root cause and repair.
2. The `.env.development.local` bug described above.

Twelve of thirteen checks passed live: cross-family isolation for loved
ones, calendar events, documents, and support people; private-note
invisibility to another active family member; and the invite
email-mismatch rejection. The one failure was a bug in the throwaway
script itself (it reused one test user as both an already-active member
and a separate invite's acceptor, correctly triggering the
`family_members_family_user_unique` constraint) — not a defect, and not
a scenario the real `invites.integration.test.ts` constructs.

**Update**: the document vault's real upload → Netlify Blobs → download →
delete round trip was verified live in a follow-up session, the same way
(a temporary in-process diagnostic route): uploaded a real file through
`uploadFamilyDocument`, downloaded it back through `downloadFamilyDocument`
and confirmed the bytes/content-type/filename matched exactly, confirmed
it's `null` when requested under a different family, then deleted it and
confirmed both the DB row and the underlying blob are gone (a second
download returns `null`). All 4 checks passed. Every family-scoped
resource type's core guarantees are now verified against a real local
database, live storage included — not just via `describe.skipIf`-gated
tests.

### The migration ledger gap (found and fixed)

`netlify database migrations apply` tracks what it's already run in a
`netlify.migrations` table (its own schema, separate from `public` — easy
to miss; `\dn`/`information_schema.schemata` shows it) with one row per
applied migration folder name. This local dev database's ledger had gaps:
several migrations' DDL had clearly, fully executed (their columns/tables
existed) but their ledger row was never written — most likely a past
`apply` run whose migration succeeded but crashed or was interrupted
before the ledger `INSERT`, which isn't wrapped in the same transaction as
the migration's own DDL in the local dev database's history. Every retry
of `apply` would then re-attempt that exact migration from the top and
immediately fail with `already exists`, blocking every migration after it
too — including `0042_add-xonorate-family-tables`, and (unrelated to
Family) the site's own homepage locally, which queries a table created by
a migration further down the blocked chain.

**Fixed** with a reconciliation pass (via a temporary, uncommitted
diagnostic route, for the same reason described above — this sandbox's
shell can't reach the local Postgres directly): walk `netlify/database/
migrations/` in order, and for each folder not yet in the ledger, execute
its SQL statement by statement, treating `already exists` as "this part
already ran, move on" and any other error as fatal (stop immediately,
report exactly where — never silently paper over a real problem). Once a
migration's statements all succeed or are confirmed already-applied,
insert its ledger row and continue. This only ever creates or alters
schema and inserts ledger rows — no `DROP`, no `DELETE`, and it stops at
the first real error rather than guessing. All 42 migrations reconciled
cleanly in one pass; the local homepage renders correctly now (confirmed:
`GET / 200`, no more `relation "investigations" does not exist`).

If this happens again (a fresh clone's local dev database, or a
colleague's): the same technique applies. Check `netlify.migrations` for
ledger gaps before assuming the migration SQL itself is broken — the SQL
in this repo has been correct throughout; the local ledger's bookkeeping
was what was inconsistent.

**Unrelated follow-up**: with the ledger fixed, a completely ordinary
`netlify database migrations apply` now works normally — used in the
next session to apply the `supportLetters`/`supportLetterRequests`
migrations (which had only ever been generated/synced as files, never
actually run against this local database) before their own live
verification passes.
