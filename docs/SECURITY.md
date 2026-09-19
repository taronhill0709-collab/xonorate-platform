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
covers this directly. The same pattern is now also applied to every
family-scoped table Phase 1 added — `src/family/calendar.ts`,
`src/family/documents.ts`, `src/family/notes.ts` (additionally scoped to
the author for mutations — see "Notes: a second authorization dimension"
below), and `src/family/support-people.ts` — each with its own
`*.integration.test.ts`. Apply it to every family-scoped table Phase 2
adds.

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

## Notes: a second authorization dimension

Every other resource type so far only has one access question: "is the
caller an active member of this family?" Notes add a second, independent
one — visibility — and the two must never be conflated:

- **Family membership answers "which family's data."** Enforced the usual
  way, by scoping every query on `familyId`.
- **Visibility answers "which member(s), within an authorized family."**
  A `visibility: "private"` note is invisible to every other member of the
  *same* family, not just other families. `listNotesForFamily()` filters
  this in the SQL query itself (`or(visibility = 'family', authorUserId =
  viewer)`) — a private note is never fetched for anyone but its author,
  so there's no code path where the server holds another member's private
  note in memory and simply declines to render it. Covered by
  `notes.integration.test.ts`'s "hides a private note from another family
  member" case.
- **Edit/delete are author-scoped regardless of visibility.** A
  "family"-visible note can be *read* by anyone in the family, but only
  its author can *change or remove* it —
  `getOwnNoteForFamily`/`updateNote`/`deleteNote` all include
  `authorUserId` in their `WHERE` clause alongside `familyId`. A non-author
  member hitting the edit route for someone else's note gets the same
  "not found" as a note that doesn't exist at all.

If a future resource type needs per-item visibility again, follow this
shape: filter visibility in the query that lists/reads, and additionally
scope mutations to whoever should be allowed to mutate — don't assume
"can read" implies "can write."

## Support letters: family-wide read, author-scoped write

A third shape, distinct from notes' private-by-default: `supportLetters`
has no visibility column at all — every active family member can read
every letter via `listSupportLettersForFamily()` (it's part of the loved
one's shared support packet, not a private aside, so there's no "hide
this from the family" case to handle). But every *mutation* —
`getOwnSupportLetterForFamily`, `updateSupportLetterAnswers`,
`regenerateSupportLetterDraft`, `updateSupportLetterContent`,
`approveSupportLetter`, `deleteSupportLetter` — is scoped to
`authorUserId` in the `WHERE` clause, same mechanism as notes' mutation
scoping. A letter is written in one person's own voice; only they can
answer its questions, regenerate it, edit it, approve it, or delete it.
Covered by `support-letters.integration.test.ts`, including the read/write
asymmetry specifically (a non-author sees the letter in the family list
but every mutation attempt returns `null`).

## AI calls carry the same authorization as everything else

`regenerateSupportLetterDraft` is called from a Server Action that already
calls `requireFamilyMember()` before anything else, then the function
itself re-checks `authorUserId` via `getOwnSupportLetterForFamily`. The AI
call itself has no independent authorization — it's just a function call
inside an already-authorized request, the same as any other database
write. What it does need independent care for is data minimization: see
`docs/AI.md`'s context rule for what actually gets sent to the model
(deliberately far less than everything the letter's Server Action could
technically reach).

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

## Verified live, once

Cross-family isolation for loved ones, calendar events, documents, and
support people; private-note invisibility to another active family
member; and the invite email-mismatch rejection have all been confirmed
against a real (local) database, not just via `describe.skipIf`-gated
tests. The document vault's actual upload → Netlify Blobs → download →
delete round trip (not just the cross-family guard, the real storage
happy path) has also been confirmed live: uploaded a real file, downloaded
it back byte-for-byte with the correct content-type and filename,
confirmed it's inaccessible under a different family, and confirmed
delete removes both the DB row and the underlying blob. See
`docs/DATABASE.md`'s "Live verification" section for how (a temporary
in-process diagnostic route, since this sandbox's `vitest` process can't
reach the local dev database directly) and exactly what ran. These were
one-time manual passes, not a repeatable CI-style gate — re-verify after
any change to the functions they covered.

## What's not proven yet

- No admin-side family read path exists yet to test `requireFamilyAdminAccess`
  against a real route (only the authz test suite exercises it directly).
- `npm run test:db`'s actual `vitest` CLI path has still never completed
  a full run against a real database in this sandbox — the live
  verification above exercised the same functions and assertions, but
  through a hand-written diagnostic script, not the committed test
  files themselves, because this sandbox's shell can't reach the local
  Postgres `netlify dev` provisions (a process-isolation property of this
  sandbox, unrelated to the now-fixed migration wedge). Running the real
  command is still worth doing in an environment where it can reach the
  database (a normal local machine or CI).
- Rate limiting exists elsewhere in the app (`src/lib/rate-limit.ts`, IP-based)
  but hasn't been applied to any family route — invite creation is
  owner-gated already (not open to the public), so this hasn't been judged
  necessary yet. Revisit if abuse patterns emerge.
