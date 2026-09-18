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
covers this directly. The same pattern is now also applied to
`src/family/calendar.ts` and `src/family/documents.ts` (each with their
own `*.integration.test.ts`) — apply it to every future family-scoped
table (notes, support people).

## Document Vault

`src/family/documents.ts` + `src/family/storage/`. The most sensitive
resource type so far, and the one place a mistake would expose real
private records (court, medical, identification documents). Three
properties this depends on:

- **No public serving route.** Unlike `/api/case-photos/[key]` (a
  deliberately public Netlify Blobs store for case photos), documents have
  no equivalent. The only way to read one is
  `/family/[familyId]/documents/[documentId]/download`, a route handler
  that calls `requireFamilyMember(familyId)` on **every request** before
  touching storage, and returns `Response("Not found", 404)` — not a
  redirect, not a cached response — for anyone not an active member.
  `Cache-Control: private, no-store` on the response for the same reason.
- **The storage key is not the security boundary.** `uploadFamilyDocument()`
  generates a random `crypto.randomUUID()` key uncorrelated with
  `familyId`/title/anything guessable — but that's defense in depth, not
  the actual protection. The protection is that no route ever accepts a
  raw storage key from a client; every read goes through
  `getFamilyDocumentForFamily(familyId, documentId)` first, and the
  storage key never leaves the server.
- **`deleteFamilyDocument`'s wrong-family case never touches storage.**
  The DB delete is scoped on both `documentId` and `familyId`; if it
  matches zero rows, the function returns `null` before
  `storageService.delete()` is ever called. This is a deliberate ordering
  (guard first, storage second) and is what made the delete path testable
  in `documents.integration.test.ts` without live Netlify Blobs
  credentials — don't reorder it.

`getSignedUrl()` was deliberately left out of `StorageService` (see that
file's header comment) — every document read is authorized per-request by
the proxy-download route instead of a time-limited direct-to-storage URL.

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
- The document upload/download/delete-with-storage-call happy paths (as
  opposed to the wrong-family guard paths, which are covered) have never
  run against live Netlify Blobs in this environment — same category of
  gap as the database itself (see docs/DATABASE.md's "Local development"
  section). Verify these for real in a working `netlify dev` session or
  after deploy before treating the vault as production-verified, not just
  authorization-verified.
- Rate limiting exists elsewhere in the app (`src/lib/rate-limit.ts`, IP-based)
  but hasn't been applied to any family route — invite creation is
  owner-gated already (not open to the public), so this hasn't been judged
  necessary yet. Revisit if abuse patterns emerge.
