import { sql } from "drizzle-orm";
import { db } from "@/db";

// THROWAWAY: applies the investigations.is_featured migration directly,
// bypassing the stuck migration ledger. Delete this route once run.
export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  await db.execute(sql`
    ALTER TABLE "investigations" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL;
  `);

  return new Response("ok");
}
