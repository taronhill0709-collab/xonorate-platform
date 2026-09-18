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
  DB-backed route) requires `netlify dev`. In this project's current
  sandbox, `netlify dev` has a known reliability problem: a second
  `netlify` CLI invocation in the same session tends to crash it. Until
  that's resolved, real end-to-end verification of new features may need
  to happen outside this environment (a normal local machine, or after
  deploy).
- **Visual-only** verification (layout, copy, design tokens — no real
  data) can run under plain `next:dev` with a placeholder `DATABASE_URL`
  in a gitignored `.env.development.local`. This was used to preview the
  `.family-scope` design direction before building real pages against it.
  It has no effect on `netlify dev` or production (Next.js never overrides
  an already-set environment variable), and any page that actually queries
  the database will still fail under it — it only unblocks pages that
  don't need real data to render.

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
