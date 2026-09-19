import {
  generateAttorneyQuestions,
  generateClemencyNarrativeDraft,
  generateMissingDocumentationInsight,
} from "@/family/ai/clemency-preparation";

// THROWAWAY read-only diagnostic: live-verify Clemency Preparation's
// three AI calls against realistic sample data. Split into one call per
// request (?step=narrative|missingdocs|attorney) rather than chaining
// all three in one request — chaining them hit Netlify's function
// execution limit (a 502 with no body) the first time this was tried.
// Costs a real Anthropic API call per request — delete this route once
// checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const step = new URL(request.url).searchParams.get("step");
  const lovedOneName = "Marcus";

  if (step === "narrative") {
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
    return Response.json({ narrative });
  }

  if (step === "missingdocs") {
    const missingDocs = await generateMissingDocumentationInsight({
      lovedOneName,
      existingDocumentTitles: ["GED Certificate", "Character reference letter from Pastor Grant"],
    });
    return Response.json({ missingDocs });
  }

  if (step === "attorney") {
    const attorneyQuestions = await generateAttorneyQuestions({
      lovedOneName,
      narrativeContent:
        "My name is Marcus. In 2015 I was arrested and convicted following a robbery, and sentenced to 15 years. While incarcerated I completed my GED in 2019 and became a certified peer mentor for the substance-abuse recovery program in 2022. My sister Renee is ready to help with housing and family support, and Pastor Grant has offered community support.",
      likelyMissingDocuments: [
        "Court records (judgment and sentence)",
        "Employment history or verification",
        "Institutional conduct record",
      ],
    });
    return Response.json({ attorneyQuestions });
  }

  return Response.json({ error: "Pass ?step=narrative, ?step=missingdocs, or ?step=attorney" }, { status: 400 });
}
