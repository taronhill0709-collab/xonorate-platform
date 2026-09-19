import {
  generateAttorneyQuestions,
  generateClemencyNarrativeDraft,
  generateMissingDocumentationInsight,
} from "@/family/ai/clemency-preparation";

// THROWAWAY read-only diagnostic: live-verify all three of Clemency
// Preparation's AI calls, chained the way the real board uses them
// (narrative -> missing-docs check -> attorney questions), against
// realistic sample data. Costs three real Anthropic API calls — delete
// this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const lovedOneName = "Marcus";

  const narrative = await generateClemencyNarrativeDraft({
    lovedOneName,
    chronology: [
      { eventType: "Arrest", eventDate: "2015-03-10", description: "Arrested following a robbery." },
      { eventType: "Conviction", eventDate: "2015-11-02", description: "Convicted and sentenced to 15 years." },
      { eventType: "Milestone", eventDate: "2019-06-15", description: "Completed GED while incarcerated." },
      {
        eventType: "Milestone",
        eventDate: "2022-01-20",
        description: "Became a certified peer mentor for the substance-abuse recovery program.",
      },
    ],
    accomplishments: [
      { title: "GED Certificate", description: "Completed high school equivalency program.", achievedDate: "2019-06-15" },
      {
        title: "Peer Mentor Certification",
        description: "Certified to mentor others in substance-abuse recovery.",
        achievedDate: "2022-01-20",
      },
      { title: "Clean disciplinary record since 2018", description: null, achievedDate: null },
    ],
    supportPeople: [
      { name: "Renee", canHelpWith: ["Housing", "Family"] },
      { name: "Pastor Grant", canHelpWith: ["Community"] },
    ],
  });

  const missingDocs = await generateMissingDocumentationInsight({
    lovedOneName,
    existingDocumentTitles: ["GED Certificate", "Character reference letter from Pastor Grant"],
  });

  const attorneyQuestions = await generateAttorneyQuestions({
    lovedOneName,
    narrativeContent: narrative,
    likelyMissingDocuments: missingDocs.likelyMissing,
  });

  return Response.json({ narrative, missingDocs, attorneyQuestions });
}
