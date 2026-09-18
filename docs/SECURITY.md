# Security — Xonorate Family

Family data is private by construction — a family's information should
never be reachable by anyone outside that family without an explicit,
logged, separate admin path. This document covers what's built so far;
extend it as new resource types and the AI/billing layers are added.

## Authorization model

Three distinct paths, in `src/family/authz.ts`:

1. **`requireFamilyMember(familyId)`** — the only thing that grants a
   session access to a family's data. Looks up an **active**
   `familyMembers` row for `(familyId, session.user.id)`. Deliberately does
   **not** let admins through — an admin with no membership row gets
   `ForbiddenError` here, same as anyone else.
2. **`requireFamilyOwner(familyId)`** — `requireFamilyMember` plus a
   `role === "owner"` check, for owner-only actions (inviting/removing
   members, deleting a loved one).
3. **`requireFamilyAdminAccess(...)`** — the only sanctioned way for an
   admin to read family data. Calls the existing `requireAdmin()` and
   **always** writes an `auditLog` row before returning. Not yet called
   from any route (no admin family-oversight UI exists yet) — wire it in
   when that's built, not `requireFamilyMember`.

`users.role` (`supporter`/`admin`) is untouched by any of this — family
access is entirely `familyMembers`-based, so nothing here can weaken
`requireAdmin()` or `proxy.ts`'s existing admin gate.

## Never trust an ID from the client alone

Every resource-scoped query joins on **both** the resource ID and the
`familyId` the caller is authorized for — never fetches by resource ID
first and checks `familyId` in application code afterward. See
`getLovedOneForFamily`/`updateLovedOne`/`deleteLovedOne` in
`src/family/loved-ones.ts`: a `lovedOneId` that belongs to a different
family always comes back "not found," never "forbidden" (which would
confirm the ID exists) and never the actual row. `loved-ones.integration.test.ts`
covers this directly. Apply the same pattern to every future family-scoped
table (documents, notes, support people, calendar events).

## Invite tokens

`src/family/invites.ts`. A `crypto.randomBytes(24)` hex token (same
convention as petition signature confirmation), 7-day expiry. Two
properties worth preserving in any future change:

- **Acceptance requires the logged-in user's own email to match the
  invite's `invitedEmail`.** Without this, a forwarded or leaked token
  link could let anyone with an Xonorate account claim someone else's
  invite slot. See the "rejects acceptance when email doesn't match" case
  in `invites.integration.test.ts`.
- Membership starts at `status: "invited"` and only flips to `"active"` on
  explicit acceptance — even if the invitee already has an Xonorate
  account. No family data is exposed to an invited-but-not-accepted row
  (`requireFamilyMember` excludes non-active status).

## Route-level exposure

`[familyId]/layout.tsx` returns `notFound()` (not a "forbidden" page) for
a non-member — a family's existence isn't confirmed to someone who
shouldn't see it. The invite-acceptance page is the one intentional
exception: it's reachable by URL alone (any logged-in user can *view* an
invite's target family name), because the token itself is the proof of
authorization to view it; accepting still requires the email match above.

## Audit logging

`src/family/audit.ts`'s `logAuditEvent()` writes to `auditLog` (polymorphic
`targetType`/`targetId`, same convention as the existing `comments` table).
Currently only called from `requireFamilyAdminAccess` — once an admin
family-oversight UI exists, every read through that path must call it, not
skip straight to a raw query.

## What's not proven yet

- No admin-side family read path exists yet to test `requireFamilyAdminAccess`
  against a real route (only the authz test suite exercises it directly).
- Rate limiting exists elsewhere in the app (`src/lib/rate-limit.ts`, IP-based)
  but hasn't been applied to any family route — invite creation is
  owner-gated already (not open to the public), so this hasn't been judged
  necessary yet. Revisit if abuse patterns emerge.
