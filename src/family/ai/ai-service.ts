import type { ZodType } from "zod";

// The application-level AI interface, per the approved architecture plan
// (item 36): Family's AI-assisted tools depend on this, never on
// @anthropic-ai/sdk directly, so the provider can be swapped later without
// touching any tool's own file (support-letter.ts today; reentry/parole/
// clemency/case-organizer as Phase 2 continues).
//
// Deliberately just one method so far — `draft`. The plan's original
// sketch also named generate/summarize/extract/classify, but nothing in
// Family needs those yet; adding a method no caller uses would just be
// unverified surface area. Add the next one when a real tool needs it
// (Case Organizer's document extraction is the likely first candidate for
// `extract`).
export class AIRefusalError extends Error {}

export interface AIService {
  /**
   * Generates a single structured object from a system+user prompt. The
   * caller is responsible for what goes into `prompt` — this method sends
   * exactly that and nothing else; see docs/AI.md's context-selection rule
   * for why callers must assemble context explicitly rather than this
   * service reaching into the database itself.
   */
  draft<T>(params: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    model?: string;
    effort?: "low" | "medium" | "high";
    maxTokens?: number;
  }): Promise<T>;
}
