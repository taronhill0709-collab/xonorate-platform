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
  calendar.ts                 calendar event CRUD, always scoped to familyId
  calendar-types.ts           client-safe enum labels — see below
  dashboard.ts                pure date logic (no DB import at all — unit-testable)
  documents.ts                document CRUD, always scoped to familyId
  documents-types.ts           client-safe enum labels/limits — see below
  notes.ts                    note CRUD — family-visibility filtered in
                               SQL, edit/delete additionally author-scoped
  notes-types.ts               client-safe enum labels — see below
  support-people.ts           support-network CRUD, always scoped to
                               familyId — no *-types.ts split needed here;
                               canHelpWith is a free-text jsonb tag array,
                               not a db enum, so there's nothing to leak
                               a `db` import through
  storage/
    storage-service.ts          StorageService interface
    netlify-blobs-provider.ts   the only implementation so far
    index.ts                    re-exports the active provider as `storageService`
  support-letters.ts           support letter CRUD — family-wide read,
                               author-scoped write (see docs/SECURITY.md)
  support-letters-types.ts     client-safe enum labels, question sets,
                               and getLetterContent (pure — see below)
  ai/
    ai-service.ts                AIService interface (see docs/AI.md)
    anthropic-provider.ts        the only implementation so far
    index.ts                     re-exports the active provider as `aiService`
    support-letter.ts            the Support Letter Builder's own prompt/
                                  schema, sitting on aiService.draft()
  support-letter-requests.ts   invite someone outside the family to write
                               their own letter — a separate table, not a
                               nullable-author variant of supportLetters;
                               its public functions are authorized purely
                               by token possession, no login, no family
                               membership (see docs/SECURITY.md)
  reentry-plan.ts              reentry plan CRUD — family-wide read/write,
                               always scoped to lovedOneId+familyId; one
                               plan per loved one, one row per category,
                               created together (ensureReentryPlanForLovedOne)
  reentry-plan-types.ts        client-safe category/status labels, the
                               fixed category list and order, and
                               summarizeReentryPlanGaps (pure — see below)
  ai/reentry-plan.ts           the Reentry Planner's own prompts: a gap-
                               detection insight ("you have X and Y but not
                               Z") and a per-category 30/60/90-day drafting
                               assist, both on aiService.draft()

src/app/family/**            Routes and Server Actions — thin. A page loads
                             data via src/family/*.ts and renders; an
                             actions.ts calls one of the requireFamily*()
                             functions first, then a src/family/*.ts
                             function, then revalidates/redirects. Business
                             logic does not live in actions.ts or page.tsx.
```

### Keep client-safe constants out of DB-touching files

A file that imports `db` (from `src/db`) pulls in `pg`, a Node-only
package, at module scope. If a `"use client"` component imports *anything*
from that file — even just a label constant or a type — the bundler
includes the whole module, and the build fails trying to bundle `pg` for
the browser. This bit `calendar.ts`: a client form imported
`CALENDAR_EVENT_TYPE_LABELS` from it and broke `next build` (caught by a
full production build, not by `tsc` alone — `tsc` has no concept of the
client/server bundle boundary).

The fix, and the pattern to repeat for every future domain module with an
enum a form needs to render (documents' category, notes' visibility —
support people's `canHelpWith` turned out to be free text, not a db enum,
so it didn't need this split): put enum-derived types and their
human-language label maps in a separate `*-types.ts` file that imports
only from `@/db/schema` (safe — it has no `db`/`pg` import, just
drizzle-orm table/enum definitions) and never from `@/db` itself. Client
components import from `*-types.ts`; server-side code (actions, pages) can
import from either, since the DB-touching file re-exports the same names
for convenience.

This split exists so authorization and data-access logic can be
integration-tested (`*.integration.test.ts` in `src/family/`) without
spinning up Next.js routing, and so a future AI/billing/storage layer can
import the same domain functions Server Actions already use.

## Route tree

- `/family` — routes to onboarding (no family), a single family's dashboard
  (one family), or a switcher (multiple families).
- `/family/new` — onboarding: create a family.
- `/family/invite/[token]` — accept-invite landing page. Deliberately
  **outside** `/family/[familyId]/**` — see "Why the invite route isn't
  nested" below.
- `/family/[familyId]/**` — gated by `[familyId]/layout.tsx`
  (`requireFamilyMember`, 404s a non-member rather than showing a
  forbidden page, so a family's existence isn't confirmed to outsiders).
  - `/family/[familyId]` — the dashboard: What Needs Attention, Upcoming
    (merged key dates + calendar events), Loved Ones, Quick Actions.
  - `/family/[familyId]/members` — invite/list/remove members.
  - `/family/[familyId]/loved-ones/new`, `/loved-ones/[lovedOneId]`,
    `/loved-ones/[lovedOneId]/edit` — loved-one CRUD; the profile page also
    surfaces that loved one's documents and support people.
  - `/family/[familyId]/calendar`, `/calendar/new`,
    `/calendar/[eventId]/edit` — calendar events.
  - `/family/[familyId]/documents`, `/documents/new`,
    `/documents/[documentId]/edit`, `/documents/[documentId]/download` —
    the document vault; `download` is a route handler, not a page (see
    docs/SECURITY.md's Document Vault section).
  - `/family/[familyId]/notes`, `/notes/new`, `/notes/[noteId]/edit` —
    private/family notes.
  - `/family/[familyId]/support`, `/support/new`,
    `/support/[personId]/edit` — the support network.
  - `/family/[familyId]/letters`, `/letters/new`, `/letters/[letterId]` —
    the Support Letter Builder (Phase 2's first tool — see docs/AI.md).
    `[letterId]` is one combined workflow page (answer questions ->
    generate -> edit -> approve -> delete), not split across sub-routes.
    Lists both self-written letters and approved Support Letter Requests
    (below) in one merged view.
  - `/family/[familyId]/letters/requests/new` — a family member invites
    someone outside the family to write their own letter.
  - `/family/[familyId]/reentry`, `/reentry/[lovedOneId]` — the Reentry
    Planner (Phase 2's second tool — see docs/AI.md). `/reentry` redirects
    straight to the board for a family with one loved one, or offers a
    chooser for more than one; `/reentry/[lovedOneId]` is one board page
    (lazily creates the plan on first visit via
    `ensureReentryPlanForLovedOne`, then reads/writes it), not split across
    sub-routes. Family-wide read **and** write — unlike Letters, which is
    author-scoped, a reentry plan is shared planning work any active member
    can edit.
- `/letter-request/[token]` — the invitee's own page. Deliberately
  **outside** `/family/**` entirely (not just outside `[familyId]`, the
  way the accept-invite page is) — `proxy.ts`'s edge middleware only
  matches `/family/:path*`, so this route is never gated behind a login
  requirement, matching the design goal that the invitee needs no
  Xonorate account at all. Authorized purely by possessing the token; see
  docs/SECURITY.md.

Phase 1 (Foundation) is complete. Phase 2 (Intelligence) is underway: the
Support Letter Builder, Support Letter Requests, and the Reentry Planner
are built and live-verified with real AI calls (docs/AI.md,
docs/SECURITY.md); Parole Preparation, Clemency Preparation, and Case
Organizer are next per the approved build order and haven't been
started.

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

Billing, Parole Preparation, Clemency Preparation, Case Organizer,
professional dashboards, Xonorate Inside. See the phased build order in
the approved architecture plan. `[familyId]/layout.tsx`'s nav shows a
"coming soon" marker for the broader "Prepare" section (which Letters and
the Reentry Planner are the first real parts of) rather than a dead link.
