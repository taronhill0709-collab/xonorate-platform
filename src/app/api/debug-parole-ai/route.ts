import { generateParolePreparationInsight, type ParoleSectionSummary } from "@/family/ai/parole-preparation";

// THROWAWAY read-only diagnostic: live-verify Parole Preparation's AI
// call against a realistic mix of section statuses and a support
// network, the same technique used for the Reentry Planner. Costs a
// real Anthropic API call — delete this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const lovedOneName = "Marcus";

  const sections: ParoleSectionSummary[] = [
    { key: "support_network", status: "incomplete" },
    { key: "housing", status: "complete" },
    { key: "employment", status: "incomplete" },
    { key: "transportation", status: "not_started" },
    { key: "education", status: "not_started" },
    { key: "community_support", status: "not_started" },
    { key: "personal_goals", status: "complete" },
    { key: "family_support", status: "complete" },
    { key: "first_90_days", status: "incomplete" },
    { key: "support_letters", status: "not_started" },
    { key: "documents", status: "not_started" },
  ];

  const supportPeople = [
    { name: "Renee", canHelpWith: ["Housing"] },
    { name: "Darnell", canHelpWith: [] },
  ];

  const insight = await generateParolePreparationInsight({ lovedOneName, sections, supportPeople });

  return Response.json({ insight });
}
