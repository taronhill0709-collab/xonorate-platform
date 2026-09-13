import { desc } from "drizzle-orm";
import { db } from "@/db";
import { investigations } from "@/db/schema";

// THROWAWAY read-only diagnostic: dump investigations to figure out why a
// hero-photo edit isn't showing on the homepage's "featured investigation"
// (which shows the most recently PUBLISHED one, not the one last edited).
// Delete this route once checked.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db
    .select({
      id: investigations.id,
      title: investigations.title,
      status: investigations.status,
      publishedAt: investigations.publishedAt,
      updatedAt: investigations.updatedAt,
      heroImageUrl: investigations.heroImageUrl,
    })
    .from(investigations)
    .orderBy(desc(investigations.updatedAt));

  return Response.json(rows);
}
