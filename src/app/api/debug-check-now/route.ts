import { db } from "@/db";
import { investigations } from "@/db/schema";

// THROWAWAY read-only: quick check of current investigations state right
// after the user's latest save attempt (a network request did fire this
// time). Delete after checking.
export async function GET(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db
    .select({
      id: investigations.id,
      title: investigations.title,
      isFeatured: investigations.isFeatured,
      heroImageUrl: investigations.heroImageUrl,
      updatedAt: investigations.updatedAt,
    })
    .from(investigations);

  return Response.json(rows);
}
