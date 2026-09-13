import { db } from "@/db";
import { investigations } from "@/db/schema";

// THROWAWAY read-only: checks current investigations state to see if
// "the section isn't updating" is because there's only one published
// investigation (so isFeatured has nothing to visibly change against).
// Delete after checking.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db.select().from(investigations);

  return Response.json(rows);
}
