# AI — Xonorate Family

Phase 2 (Intelligence) started with the Support Letter Builder — the
first real AI-assisted tool, and the first thing to actually use the
`AIService` abstraction from the approved architecture plan. This
document covers the abstraction, the context rule every tool must follow,
and the guardrails, so the next tool (Reentry Planner, Parole Prep,
Clemency Prep, Case Organizer) can follow the same shape.

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
