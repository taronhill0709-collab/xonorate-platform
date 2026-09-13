import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";

// THROWAWAY: reproduces featurePost's DB write directly (skipping
// requireAdmin, which would reject this unauthenticated test route) to
// check whether the underlying reorder actually changes what the
// homepage renders. Delete after checking.
export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const { postId } = (await request.json()) as { postId?: string };
  if (!postId) return new Response("Missing postId", { status: 400 });

  const rows = await db.select({ id: posts.id }).from(posts).orderBy(asc(posts.sortOrder), desc(posts.createdAt));
  const ids = rows.map((r) => r.id).filter((id) => id !== postId);
  ids.unshift(postId);

  await Promise.all(ids.map((id, i) => db.update(posts).set({ sortOrder: i }).where(eq(posts.id, id))));
  revalidatePath("/admin/posts");
  revalidatePath("/news");
  revalidatePath("/");

  return Response.json({ newOrder: ids });
}
