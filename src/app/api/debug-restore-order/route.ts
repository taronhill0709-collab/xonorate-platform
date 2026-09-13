import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";

// THROWAWAY: restores the post order to what it was before an earlier
// diagnostic test promoted "23 Violations..." to the top. Delete after
// running once.
const ORIGINAL_ORDER = [
  "2ccce698-cf37-4090-9f64-586bc31647ae", // "He's spent 18 years..."
  "31e92a0e-d8b2-4a4b-89ea-4db9556fd510", // "'Broadview 6' judge..."
  "40ff0164-68c0-4783-a42e-b4f35c08d6a5", // "23 Violations..."
];

export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  await Promise.all(ORIGINAL_ORDER.map((id, i) => db.update(posts).set({ sortOrder: i }).where(eq(posts.id, id))));

  return new Response("ok");
}
