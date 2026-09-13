import { eq } from "drizzle-orm";
import { db } from "@/db";
import { investigations } from "@/db/schema";

// THROWAWAY: deletes the one stuck investigation the user asked to remove
// (edits to it have never persisted, even with the DB-write logic proven
// to work directly) so they can create a fresh one. Delete this route
// after running once.
const INVESTIGATION_ID = "5bea5cc2-9d84-403d-bdd7-fe0ef3daf60b";

export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  await db.delete(investigations).where(eq(investigations.id, INVESTIGATION_ID));
  return new Response("ok");
}
