# Deployment

No changes to the deployment pipeline for Xonorate Family. Same as the
rest of the site:

- Hosted on Netlify, source of truth in GitHub.
- **`git push` to `main` does not deploy.** Deploys are manual:
  `netlify deploy --prod --build`.
- Database migrations ship through the existing (now tooled — see
  `docs/DATABASE.md`) `drizzle/` + `netlify/database/migrations/` process,
  applied via `netlify database migrations apply`.
- No new environment variables were required for Phase 1 (no new external
  provider was introduced).

## `netlify.toml` — still not committed

The repo still has no committed `netlify.toml`; build/redirect/header
config is either UI-managed or regenerated into the gitignored
`.netlify/netlify.toml` at build time (see the original architecture
audit for the full breakdown of what's UI-owned vs. default-managed in
there). This is being held off deliberately rather than fixed
opportunistically: committing one risks silently overriding UI-managed
settings (build command, publish directory) that can't be verified from
outside the Netlify dashboard, and that's exactly the kind of "modifies
shared deployment config" change that should be verified against a deploy
preview before touching production, not bundled into a feature branch.
Revisit this once Phase 1 is stable and there's a natural point to test it
safely.

## Local preview limitation

`src/db/index.ts` connects to the database eagerly at import time, and
that only resolves under `netlify dev` or an actual Netlify build/deploy —
not plain `next dev`. Two consequences:

- **Functional testing** of anything in `/family/**` (or any other
  DB-backed route) requires `netlify dev`, which still has a real
  reliability problem in this sandbox independent of any migration
  state: it tends to crash on its own after ~20s regardless of what the
  app is doing, and its own internal readiness probe hitting `/` and
  giving up (killing the whole dev server) if that request errors was
  what originally made a pre-existing local-database migration wedge so
  disruptive — that wedge is now fixed (see `docs/DATABASE.md`'s
  "migration ledger gap" section), and the homepage renders correctly
  locally now, but the ~20s crash-on-its-own behavior persists and isn't
  understood yet. Getting a stable window still benefits from a retry
  loop rather than assuming the first `preview_start` will hold.
- **Visual-only** verification (layout, copy, design tokens — no real
  data) can run under plain `next:dev` with `DATABASE_URL` set inline for
  that one command — e.g. `DATABASE_URL=postgres://placeholder/placeholder
  npm run next:dev` — **never** as a persisted `.env.development.local`
  file. That file was tried and deleted: `netlify dev` reads
  `.env.development.local` too and treats it as authoritative, so a
  placeholder left there silently replaces `netlify dev`'s real local
  database connection instead of only affecting plain `next dev` as
  intended. See `docs/DATABASE.md` for the full account.

## Portability

Family's domain logic (`src/family/*.ts`) doesn't import any Netlify
package directly, with one now-real exception: `src/family/storage/`
implements the `StorageService` abstraction from the approved plan, and
its only provider (`netlify-blobs-provider.ts`) does use `@netlify/blobs`.
Everything above that layer — `documents.ts`, every document route —
depends only on the `StorageService` interface, so replacing Netlify Blobs
later means writing one new provider file, not touching Family's document
code. AI and billing providers haven't been wired in yet; when those land
(Phase 2+), they go through the `AIService`/`BillingService` abstractions
the same way, not direct provider calls from Family route code.

The document vault's other Netlify coupling is indirect: the same
`src/db/index.ts` (Netlify Database connection resolution) every other
Family feature already depends on.
