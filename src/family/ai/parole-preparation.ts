import { z } from "zod";
import { aiService } from "@/family/ai";
import { PAROLE_SECTIONS, type ParoleSectionKey, type ParoleSectionStatus } from "@/family/parole-preparation-types";
import type { SupportPersonSummary } from "@/family/ai/reentry-plan";

// Guardrails restated in this tool's own words, per docs/AI.md. The spec
// for this specific tool adds one beyond the usual set: never predict or
// guarantee a parole outcome — this is a structured-workflow gap-tracker,
// not a chatbot and not a parole-outcome predictor.
const GUARDRAILS = `Hard rules:
- Never invent a fact, relationship, resource, or circumstance that wasn't given to you.
- Never predict, promise, or imply a parole outcome — not "the board will likely grant this," not "this makes release more likely," not a percentage or odds of any kind. Preparation completeness has no bearing on what a parole board decides, and you must not suggest otherwise.
- Never claim legal authority, cite a statute or case, or make a legal argument — this is a preparation aid, not legal advice.
- If a section is thin or you don't have enough information, say so plainly rather than filling the gap with something "typical" for a parole hearing.`;

const insightSchema = z.object({
  summary: z
    .string()
    .describe(
      "One to three sentences naming which of the eleven preparation sections are complete, in progress, or not started yet, in the family's own terms.",
    ),
  nextBestAction: z
    .string()
    .describe(
      "One concrete, specific next step for the least-prepared area — reference a named support person's stated willingness to help if one is available and relevant, otherwise a generic first step for that section.",
    ),
});

export type ParoleSectionSummary = { key: ParoleSectionKey; status: ParoleSectionStatus };

function buildInsightPrompt(params: {
  lovedOneName: string;
  sections: ParoleSectionSummary[];
  supportPeople: SupportPersonSummary[];
}): string {
  const labelOf = (key: ParoleSectionKey) => PAROLE_SECTIONS.find((s) => s.key === key)?.label ?? key;
  const byStatus = (status: ParoleSectionStatus) =>
    params.sections
      .filter((s) => s.status === status)
      .map((s) => labelOf(s.key))
      .join(", ") || "(none)";

  const supportLines = params.supportPeople.length
    ? params.supportPeople
        .map((p) => `- ${p.name}: can help with ${p.canHelpWith.length ? p.canHelpWith.join(", ") : "(not specified)"}`)
        .join("\n")
    : "(no support network entries yet)";

  return [
    `Parole preparation for ${params.lovedOneName}, across all eleven sections of the workflow.`,
    "",
    `Complete sections: ${byStatus("complete")}`,
    `Incomplete (started, not finished) sections: ${byStatus("incomplete")}`,
    `Not started sections: ${byStatus("not_started")}`,
    "",
    "Support network on file (use ONLY these facts if you reference anyone by name):",
    supportLines,
  ].join("\n");
}

export async function generateParolePreparationInsight(params: {
  lovedOneName: string;
  sections: ParoleSectionSummary[];
  supportPeople: SupportPersonSummary[];
}): Promise<{ summary: string; nextBestAction: string }> {
  return aiService.draft({
    system: `You help families using Xonorate Family track their preparation for a loved one's parole hearing and suggest the single next best action.\n\n${GUARDRAILS}`,
    prompt: buildInsightPrompt(params),
    schema: insightSchema,
    effort: "low",
    maxTokens: 500,
  });
}
