import { sql } from "drizzle-orm";
import { db } from "@/db";

// THROWAWAY: applies the library_photos migration directly, bypassing the
// stuck migration ledger (netlify database migrations apply fails on an
// earlier already-applied column). Delete this route once run.
export async function POST(request: Request) {
  const secret = request.headers.get("x-daily-content-secret");
  if (!process.env.DAILY_CONTENT_SECRET || secret !== process.env.DAILY_CONTENT_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "library_photos" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "url" text NOT NULL,
      "label" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  return new Response("ok");
}
