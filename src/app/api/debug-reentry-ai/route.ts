import {
  generateReentryPlanCategoryDraft,
  generateReentryPlanInsight,
  type ReentryPlanCategorySummary,
} from "@/family/ai/reentry-plan";

// THROWAWAY read-only diagnostic: live-verify the Reentry Planner's two AI
// calls against a realistic set of category statuses and a support
// network, the same technique docs/AI.md records for the Support Letter
// Builder. Costs a real Anthropic API call — delete this route once
// checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const lovedOneName = "Marcus";

  const categories: ReentryPlanCategorySummary[] = [
    { category: "identification", status: "complete" },
    { category: "housing", status: "complete" },
    { category: "employment", status: "complete" },
    { category: "transportation", status: "not_started" },
    { category: "education", status: "not_started" },
    { category: "healthcare", status: "not_started" },
    { category: "benefits", status: "not_started" },
    { category: "finances", status: "incomplete" },
    { category: "family", status: "complete" },
    { category: "community", status: "not_started" },
    { category: "legal_obligations", status: "incomplete" },
  ];

  const supportPeople = [
    { name: "Darnell", canHelpWith: ["Transportation"] },
    { name: "Renee", canHelpWith: ["Housing", "Family"] },
  ];

  const insight = await generateReentryPlanInsight({ lovedOneName, categories, supportPeople });

  const categoryDraft = await generateReentryPlanCategoryDraft({
    category: "transportation",
    lovedOneName,
    existing: { plan30Day: null, plan60Day: null, plan90Day: null },
    supportPeople,
  });

  return Response.json({ insight, categoryDraft });
}
