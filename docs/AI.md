# AI — Xonorate Family

Phase 2 (Intelligence) started with the Support Letter Builder — the
first real AI-assisted tool, and the first thing to actually use the
`AIService` abstraction from the approved architecture plan. The Reentry
Planner is the second, Parole Preparation the third, Clemency Preparation
the fourth, all following the same shape. This document covers the
abstraction, the context rule every tool must follow, and the guardrails,
so the next tool (Case Organizer) can follow the same shape too.

## The `AIService` abstraction

`src/family/ai/`:
- `ai-service.ts` — the interface. Just one method so far, `draft()` —
  the plan's original sketch also named `generate`/`summarize`/`extract`/
  `classify`, but nothing in Family needs those yet. Add the next method
  when a real tool needs it (Case Organizer's document extraction is the
  likely first candidate for `extract`) rather than building unused
  surface area now.
- `anthropic-provider.ts` — the only implementation, wrapping
  `@anthropic-ai/sdk` the same way the rest of the codebase's AI features
  do (`client.messages.parse()` with `zodOutputFormat`, checking
  `stop_reason === "refusal"` and a null `parsed_output` — see
  `src/lib/ask-xonorate.ts`/`impact-pipeline.ts` for the established
  pattern this follows). Model default is `claude-opus-5`, not
  `sonnet-5` — Family's AI tools are drafting assistance a user reads and
  edits, not a real-time chat reply someone waits on, so quality matters
  more than latency here (same reasoning as `impact-pipeline.ts`'s
  `draftImpactNarrative`).
- `index.ts` — re-exports the active provider as `aiService`. Swapping
  providers later means changing this one line, not any tool file.
- `support-letter.ts` — the Support Letter Builder's own prompt/schema/
  generation function, sitting on top of `aiService.draft()`. Each tool
  gets its own file like this — never one shared generic prompt.
- `reentry-plan.ts` — the Reentry Planner's two calls: a gap-detection
  insight (spec section 19's "you have identified housing and employment,
  but transportation has not yet been planned" example, plus a "next best
  action") and a per-category 30/60/90-day drafting assist. Two calls in
  one file, not two files, since they share the same guardrail text and
  both belong to the same tool.
- `parole-preparation.ts` — Parole Preparation's one call: the same
  gap-detection-plus-next-best-action shape as the Reentry Planner's
  insight, across all 11 spec sections (not just the 7 this tool stores
  itself — see docs/ARCHITECTURE.md). No per-section drafting assist;
  the spec only asked for "identify missing preparation areas" and a
  "NEXT BEST ACTION" here, not drafting help, so that's all this tool
  builds — the same "don't build unused surface area" reasoning as
  `ai-service.ts`'s single `draft()` method.
- `clemency-preparation.ts` — Clemency Preparation's three calls: a
  narrative draft (spec section 20's "create draft narratives," built
  from the loved one's Timeline + rehabilitation accomplishments +
  support network — never any other family data), a missing-
  documentation insight (checks the family's own clemency-tagged document
  *titles* against a static reference checklist defined in this file,
  never the documents' actual contents, which this tool never reads),
  and attorney-question generation (section 20's "prepare questions for
  an attorney" — the tool asks the questions, never answers them). Three
  calls in one file, same reasoning as `reentry-plan.ts`'s two: one
  shared guardrail block, one tool.

Tool code (`support-letters.ts` today) calls `aiService.draft(...)` or a
tool-specific wrapper like `generateSupportLetterDraft(...)` — never
`new Anthropic()` directly. That's the enforcement point for the
provider-swap promise: grep for `@anthropic-ai/sdk` inside `src/family/`
and the only hit should be `anthropic-provider.ts`.

## Context must be explicit

**Never send more than a tool actually needs.** The Support Letter
Builder sends exactly: the loved one's name, the author's own display
name, the recipient name (if any), and the author's own answers to that
letter's guided questions — see `support-letter.ts`'s `buildPrompt()`.
It does **not** send the loved one's case details, other family members'
notes, the document vault, or any other letter. A family's private data
is large and sensitive; every AI call must construct its own minimal
prompt by hand, not delegate "just send everything relevant" to some
context-assembly helper that could quietly grow to include more over
time. When building the next tool, write out what it actually needs
before writing the prompt, the same way this one did.

The Reentry Planner follows the same discipline: its insight call sends
only each category's status (not the family's raw notes, documents, or
case details) plus the support network's name + `canHelpWith` tags — never
a support person's email, phone, or free-text `notes` field. Its
per-category drafting call additionally sends that one category's own
existing 30/60/90-day text, never another category's, and only the
support people whose `canHelpWith` plausibly matches that category.

Parole Preparation's insight call sends only each of the 11 sections'
*status* (complete/incomplete/not_started) plus the same minimal support-
network summary — never the freeform notes text behind a freeform
section's status, never a support letter's content, never a document's
title or contents, never the Reentry Plan's own 30/60/90-day text behind
its rolled-up First 90 Days status. The status is the only thing the
insight needs to do its job; the underlying content stays out of the
prompt entirely.

Clemency Preparation's three calls each draw a tighter box than usual.
The narrative draft sends the loved one's Timeline events, rehabilitation
accomplishments, and support-network summary — never other family notes,
documents, or case details, and never another loved one's data. The
missing-documentation check sends existing clemency-tagged document
*titles* only, never file contents (this tool never reads a document's
contents at all) — plus a static reference checklist that lives in the
code, not in any family's data. The attorney-questions call sends only
the current narrative text and the missing-documentation gaps already
identified, nothing further back into the family's records.

## Guardrails

Every tool's system prompt must state, explicitly, in its own words (not
by reference — a model reads the prompt it's given, not this file):

- **Never invent a fact, relationship, experience, accomplishment, event,
  or detail** not present in what the user provided. Never fill a gap
  with something "common in similar situations."
- **Never promise or imply a guaranteed outcome** ("this will get you
  released," "you will get the job"). See the Support Letter Builder's
  live-verified output for what compliant phrasing looks like: it
  explicitly says the decision belongs to the reader, not the letter.
- **Never claim legal authority, cite a statute/case, or make a legal
  argument.** These are personal support letters and planning aids, not
  legal filings — Family is not a law firm and must never imply
  otherwise (same rule `ask-xonorate.ts` enforces for the public site,
  applied here to a different kind of content).
- **Disclose AI assistance to the user**, not hide it. The Support Letter
  Builder shows a persistent note once a draft exists: "Drafted with AI
  assistance based on your answers. Read it over, personalize it, and
  make sure everything is accurate before sending it anywhere." Every
  future tool's UI should do the same — never present AI output as
  though the user wrote every word unassisted, and never let it be sent
  anywhere without the user reviewing it first.

Parole Preparation's spec adds a tool-specific fifth rule, restated in
`ai/parole-preparation.ts`'s own system prompt alongside the four above:
**never predict, promise, or imply a parole outcome** — not odds, not "the
board will likely grant this," not "this makes release more likely."
Preparation completeness has no bearing on what a parole board decides.
This is the same "never guarantee an outcome" principle as the second
bullet above, just spelled out explicitly for a tool where a user might
otherwise read "3 of 11 complete" as a prediction rather than a checklist.

Clemency Preparation's spec (section 20) adds its own sixth rule,
restated in `ai/clemency-preparation.ts`'s system prompt: **this is
drafting assistance, not legal advice, and the tool must never be
represented as an attorney.** Concretely, that means the narrative and
attorney-questions calls never tell the user what the law requires,
never call a document "legally sufficient," and never answer a legal
question directly — if something sounds like a legal question, the
attorney-questions generator's whole job is to put it on the list of
things to ask a real attorney instead of answering it itself. This is
the clemency-specific instance of the third bullet above (never claim
legal authority), spelled out because "drafting assistance" is easy to
blur into "legal advice" when the content itself is legal-adjacent.

These aren't just prompt instructions — `regenerateSupportLetterDraft`
throws `AIRefusalError` (from `ai-service.ts`) when the model itself
declines to generate, and the calling Server Action surfaces that as a
plain user-facing message rather than a crash. Structured output
(`zodOutputFormat`) constrains the *shape* of what comes back; it does
not by itself enforce these guardrails — the system prompt is what does
that, so treat prompt wording as load-bearing, not boilerplate.

## What's verified, and how

The full AI call was verified live once (not part of the automated test
suite — a real Anthropic API call costs money and time on every run) via
a temporary diagnostic route, the same technique used to verify the
document vault's storage round trip. Given a realistic set of guided
answers for a parole support letter, the model produced a complete,
well-structured letter that used only the provided facts and explicitly
deferred the outcome to the parole board rather than promising one. The
authorization tests (`support-letters.integration.test.ts`) cover the
family-wide-read/author-scoped-write access pattern (see
`docs/SECURITY.md`) but do not call the real AI — they test
`updateSupportLetterAnswers`/`updateSupportLetterContent`/etc. directly,
never `regenerateSupportLetterDraft`.

The Reentry Planner's two AI calls were verified live once, the same way
— a temporary diagnostic route on production, since this was built in an
environment with no working local database connection. Given a realistic
mix of category statuses (four complete, two incomplete, five not
started) and a two-person support network where only one person's
`canHelpWith` matched an unstarted category, `generateReentryPlanInsight`
correctly named every complete/incomplete/not-started category and tied
its next-best-action to that one matching support person rather than
inventing one for an unmatched category. `generateReentryPlanCategoryDraft`
produced 30/60/90-day content that stayed conditional on facts not given
("if Marcus wants a driver's license," "if a vehicle is part of the
picture") instead of asserting them, and never promised an outcome.

The first live run caught a real bug: `generateReentryPlanCategoryDraft`'s
`maxTokens` of 800 wasn't enough for three prose fields plus
structured-output overhead, so the response was cut mid-string ("Failed
to parse structured output as JSON: Unterminated string"). Raised to
2000 — a reminder that a schema with several prose fields needs
meaningfully more headroom than `support-letter.ts`'s single field, and
that this class of failure only shows up against the real API, never in
a schema-shape unit test.

`reentry-plan.integration.test.ts` covers the family-wide-read/write
authorization pattern and the one-row-per-category creation invariant
against a real database, same as `calendar.integration.test.ts`, but —
like the Support Letter tests — never calls the real AI.

Parole Preparation's one AI call was verified live once, the same way —
a temporary diagnostic route on production. Given three complete
sections, three incomplete, and five not started, plus a two-person
support network where one person's `canHelpWith` was deliberately left
empty, `generateParolePreparationInsight` reproduced the exact
complete/incomplete/not-started split with no drift, correctly noted
that the empty-`canHelpWith` person's willingness was on file without
inventing what they could help with, and suggested a concrete next step
without ever touching parole odds or a predicted outcome — the guardrail
this tool adds beyond the standard four. No bugs this run (unlike the
Reentry Planner's first attempt); the insight schema's two short fields
stayed well under its 500-token budget.

`parole-preparation.integration.test.ts` covers the same
family-wide-read/write and one-row-per-section creation pattern as the
Reentry Planner's, plus the full 11-section overview composition, but —
like every other tool's tests — never calls the real AI.

Clemency Preparation's three AI calls (`generateClemencyNarrativeDraft`,
`generateMissingDocumentationInsight`, `generateAttorneyQuestions`) have
**not** been live-verified yet — before relying on their output in
production, verify all three the same way: a temporary diagnostic route
on production, a realistic chronology/accomplishments/support-network
mix for the narrative, a realistic set of existing document titles for
the missing-documentation check, and a drafted narrative plus identified
gaps for the attorney-questions call. Check specifically that none of
the three ever drift into legal advice or attorney-like language (this
tool's sixth guardrail, above) — that's the one this spec is most
explicit about, and the one most worth scrutinizing in the actual output
rather than assuming the prompt wording alone is enough.
`timeline.integration.test.ts` and
`clemency-preparation.integration.test.ts` cover the usual
family-scoping and creation-invariant patterns against a real database,
again without calling the real AI.
