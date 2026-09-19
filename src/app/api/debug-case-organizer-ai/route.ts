import { generateCaseSummary } from "@/family/ai/case-organizer";

// THROWAWAY read-only diagnostic: live-verify Case Organizer's one
// active AI call, generateCaseSummary, against realistic sample data.
// Checks specifically for the two rules this spec is most explicit
// about: no score of any kind, and no guilt/innocence/wrongful-
// conviction determination. Costs a real Anthropic API call — delete
// this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const summary = await generateCaseSummary({
    lovedOneName: "Marcus",
    chronology: [
      { eventType: "Arrest", eventDate: "2015-03-10", description: "Arrested following a robbery at a convenience store." },
      { eventType: "Conviction", eventDate: "2015-11-02", description: "Convicted at trial and sentenced to 15 years." },
      { eventType: "Appeal Filed", eventDate: "2016-05-20", description: "Direct appeal filed challenging the eyewitness identification." },
      {
        eventType: "Milestone",
        eventDate: "2022-01-20",
        description: "Became a certified peer mentor for the substance-abuse recovery program.",
      },
      { eventType: "Hearing", eventDate: null, description: "Post-conviction relief hearing date not yet set." },
    ],
    documentTitles: [
      "Trial transcript, Vol. 1",
      "Direct appeal brief",
      "Certificate — Peer Mentor Program",
      "Eyewitness statement (original police report)",
    ],
    people: [
      { name: "Renee Carter", personType: "family_member" },
      { name: "Diane Ochoa", personType: "attorney" },
      { name: "James Whitfield", personType: "witness" },
    ],
    openIssueTitles: [
      "Trial transcript is missing pages 40-55",
      "Need to confirm whether the eyewitness has recanted",
    ],
    upcomingDateCount: 1,
  });

  return Response.json({ summary });
}
