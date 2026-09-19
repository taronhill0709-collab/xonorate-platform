import { z } from "zod";
import { aiService } from "@/family/ai";
import {
  REENTRY_PLAN_CATEGORY_LABELS,
  type ReentryPlanCategory,
  type ReentryPlanCategoryStatus,
} from "@/family/reentry-plan-types";

// Guardrails restated in this tool's own words, per docs/AI.md — a model
// reads the prompt it's given, not that file. Same rules the Support
// Letter Builder enforces (never invent a fact, never promise an outcome,
// never claim legal authority), applied to planning guidance instead of
// letter content.
const GUARDRAILS = `Hard rules:
- Never invent a fact, relationship, resource, or circumstance that wasn't given to you. Don't assume the family has a car, a specific health condition, a job offer, or any other detail unless it's stated.
- Never promise or imply a guaranteed outcome (e.g. "this will get him released," "this guarantees housing"). Reentry outcomes depend on many factors outside this plan.
- Never claim legal authority, cite a statute or case, or make a legal argument — this is a planning aid, not legal advice.
- If you don't have enough information for a category, say so plainly rather than filling the gap with something "typical" for reentry planning.`;

export type SupportPersonSummary = {
  name: string;
  canHelpWith: string[];
};

// --- Gap-detection insight (spec section 19's core example) ---

const insightSchema = z.object({
  summary: z
    .string()
    .describe(
      "One to three sentences naming which categories are planned and which aren't yet, in the family's own terms — e.g. 'You have identified housing and employment, but transportation has not yet been planned.'",
    ),
  nextBestAction: z
    .string()
    .describe(
      "One concrete, specific next step the family could take right now — reference a named support person's stated willingness to help if one is available for the most relevant gap, otherwise a generic first step for that category.",
    ),
});

export type ReentryPlanCategorySummary = {
  category: ReentryPlanCategory;
  status: ReentryPlanCategoryStatus;
};

function buildInsightPrompt(params: {
  lovedOneName: string;
  categories: ReentryPlanCategorySummary[];
  supportPeople: SupportPersonSummary[];
}): string {
  const byStatus = (status: ReentryPlanCategoryStatus) =>
    params.categories
      .filter((c) => c.status === status)
      .map((c) => REENTRY_PLAN_CATEGORY_LABELS[c.category])
      .join(", ") || "(none)";

  const supportLines = params.supportPeople.length
    ? params.supportPeople
        .map((p) => `- ${p.name}: can help with ${p.canHelpWith.length ? p.canHelpWith.join(", ") : "(not specified)"}`)
        .join("\n")
    : "(no support network entries yet)";

  return [
    `Reentry plan for ${params.lovedOneName}.`,
    "",
    `Complete categories: ${byStatus("complete")}`,
    `Incomplete (started, not finished) categories: ${byStatus("incomplete")}`,
    `Not started categories: ${byStatus("not_started")}`,
    "",
    "Support network on file (use ONLY these facts if you reference anyone by name):",
    supportLines,
  ].join("\n");
}

export async function generateReentryPlanInsight(params: {
  lovedOneName: string;
  categories: ReentryPlanCategorySummary[];
  supportPeople: SupportPersonSummary[];
}): Promise<{ summary: string; nextBestAction: string }> {
  return aiService.draft({
    system: `You help families using Xonorate Family identify gaps in a loved one's reentry plan and suggest the single next best action.\n\n${GUARDRAILS}`,
    prompt: buildInsightPrompt(params),
    schema: insightSchema,
    effort: "low",
    maxTokens: 500,
  });
}

// --- Per-category planning draft ---

const categoryDraftSchema = z.object({
  plan30Day: z.string().describe("Suggested 30-day plan content for this category. Plain text, a few sentences or short bullet-style lines."),
  plan60Day: z.string().describe("Suggested 60-day plan content for this category."),
  plan90Day: z.string().describe("Suggested 90-day plan content for this category."),
});

function buildCategoryDraftPrompt(params: {
  category: ReentryPlanCategory;
  lovedOneName: string;
  existing: { plan30Day: string | null; plan60Day: string | null; plan90Day: string | null };
  supportPeople: SupportPersonSummary[];
}): string {
  const label = REENTRY_PLAN_CATEGORY_LABELS[params.category];
  const relevantSupport = params.supportPeople.filter((p) =>
    p.canHelpWith.some((tag) => tag.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(tag.toLowerCase())),
  );

  return [
    `Category: ${label}`,
    `This is for ${params.lovedOneName}'s reentry plan.`,
    "",
    "What the family has written so far for this category (may be empty):",
    `30-day: ${params.existing.plan30Day || "(empty)"}`,
    `60-day: ${params.existing.plan60Day || "(empty)"}`,
    `90-day: ${params.existing.plan90Day || "(empty)"}`,
    "",
    relevantSupport.length
      ? `Support people who said they can help with this category — reference them by name where it fits:\n${relevantSupport.map((p) => `- ${p.name}`).join("\n")}`
      : "No support person has been identified for this category yet — you may suggest identifying one as a step, but don't invent who that might be.",
    "",
    "Suggest specific, actionable planning content for each time horizon. Build on what's already written rather than contradicting it; if a field is empty, propose a reasonable starting point for that stage.",
  ].join("\n");
}

export async function generateReentryPlanCategoryDraft(params: {
  category: ReentryPlanCategory;
  lovedOneName: string;
  existing: { plan30Day: string | null; plan60Day: string | null; plan90Day: string | null };
  supportPeople: SupportPersonSummary[];
}): Promise<{ plan30Day: string; plan60Day: string; plan90Day: string }> {
  return aiService.draft({
    system: `You help families using Xonorate Family organize one category of a loved one's reentry plan across 30/60/90-day time horizons.\n\n${GUARDRAILS}`,
    prompt: buildCategoryDraftPrompt(params),
    schema: categoryDraftSchema,
    effort: "medium",
    maxTokens: 800,
  });
}
