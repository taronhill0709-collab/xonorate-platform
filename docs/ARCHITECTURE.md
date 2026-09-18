# Xonorate Family — Architecture

Xonorate Family is a module inside the existing `xonorate-platform` Next.js
app, not a separate repo or deployment. It shares the app's auth, database,
and deployment pipeline, and adds its own domain module and route tree.

## Why one repo

Family Support needs the same `users` table as the rest of the site (a
person can both sign petitions and manage a family), needs to cross-link to
Case Review (Xonorate's core product), and the existing design system,
auth, and deployment already work. Splitting it out would mean rebuilding
all of that for no benefit — see `xonorate-institute` for what a genuinely
separate product looks like (different domain, different audience); Family
Support isn't that.

## Module boundaries

```
src/family/                 Domain logic — DB access, authorization, and
                             business rules. No Next.js/React imports here
                             (no "use client", no next/navigation) except
                             where noted; this is what integration tests
                             import directly.
  db-schema.ts               Drizzle tables, re-exported from src/db/schema.ts
  authz.ts                   requireFamilyMember / requireFamilyOwner /
                              requireFamilyAdminAccess / getUserFamilies
  audit.ts                   logAuditEvent()
  families.ts                createFamilyWithOwner, getFamily
  invites.ts                 invite token lifecycle
  loved-ones.ts               loved-one CRUD, always scoped to familyId
  facility.ts                 shared facility lookup/resolve

src/app/family/**            Routes and Server Actions — thin. A page loads
                             data via src/family/*.ts and renders; an
                             actions.ts calls one of the requireFamily*()
                             functions first, then a src/family/*.ts
                             function, then revalidates/redirects. Business
                             logic does not live in actions.ts or page.tsx.
```

This split exists so authorization and data-access logic can be
integration-tested (`*.integration.test.ts` in `src/family/`) without
spinning up Next.js routing, and so a future AI/billing/storage layer can
import the same domain functions Server Actions already use.

## Route tree (Phase 1, as built so far)

- `/family` — routes to onboarding (no family), a single family's hub (one
  family), or a switcher (multiple families).
- `/family/new` — onboarding: create a family.
- `/family/invite/[token]` — accept-invite landing page. Deliberately
  **outside** `/family/[familyId]/**` — see "Why the invite route isn't
  nested" below.
- `/family/[familyId]/**` — gated by `[familyId]/layout.tsx`
  (`requireFamilyMember`, 404s a non-member rather than showing a
  forbidden page, so a family's existence isn't confirmed to outsiders).
  - `/family/[familyId]` — hub page (loved ones + members lists). Stand-in
    for the full "what needs attention" dashboard, which is a later Phase 1
    milestone.
  - `/family/[familyId]/members` — invite/list/remove members.
  - `/family/[familyId]/loved-ones/new`, `/loved-ones/[lovedOneId]`,
    `/loved-ones/[lovedOneId]/edit` — loved-one CRUD.

### Why the invite route isn't nested under `[familyId]`

`[familyId]/layout.tsx` requires active membership. An invitee is by
definition not yet an active member, so nesting the accept-invite page
there would 404 the very people it's for. The invite route is keyed by
token alone (`/family/invite/[token]`) and looks up its family from the
token — no `familyId` in the URL, and no membership required to view it
(only to accept it, which additionally requires the logged-in user's email
to match the invite).

## Design system: `.family-scope`

Same mechanism as the existing `.admin-scope` in `src/app/globals.css`: a
class that overrides the same CSS variable names (`--background`,
`--brand`, etc.) used everywhere else, so no component needs
Family-specific styling logic. Family gets a warm cream/terracotta/sage
palette, distinct from both the dark public editorial site and the light
admin utility scope, plus a non-uppercase treatment of the shared
`.font-serif` heading style. See the comment block above `.family-scope` in
`globals.css` for the full rationale.

## Auth gate

`src/proxy.ts` (Netlify Edge Function) now gates `/family/:path*` the same
way it already gated `/admin/:path*`: redirect to `/login` with the real
path as `callbackUrl` if there's no session. `src/app/family/layout.tsx`
re-checks `auth()` as defense in depth, matching the existing
admin-layout pattern — Server Actions must not rely on middleware alone.

## What's deliberately not built yet

AI toolbox, billing, calendar, document vault, notes, support network,
professional dashboards, Xonorate Inside. See the phased build order in
the approved architecture plan. `[familyId]/layout.tsx`'s nav shows
"coming soon" markers for Prepare/Organize rather than dead links.
