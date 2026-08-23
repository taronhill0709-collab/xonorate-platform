// TEMPORARY — one-time production seed for the three Camden, NJ NRE-sourced
// exonerated cases (see scripts/seed-camden-nre-cases.ts). Visit this route
// once while signed in as an admin on the live site, confirm the cases
// appear on /exonerated, then delete this route (and this directory) in a
// follow-up commit — it has no reason to exist afterward.
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { CAMDEN_NRE_CASES } from "@/lib/seed-data/camden-nre-cases";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slugs = CAMDEN_NRE_CASES.map((c) => c.slug);
  const existing = await db
    .select({ slug: cases.slug })
    .from(cases)
    .where(inArray(cases.slug, slugs));
  const existingSlugs = new Set(existing.map((row) => row.slug));

  const toInsert = CAMDEN_NRE_CASES.filter((c) => !existingSlugs.has(c.slug));
  if (toInsert.length > 0) {
    await db.insert(cases).values(toInsert);
  }

  return NextResponse.json({
    inserted: toInsert.map((c) => c.slug),
    alreadyPresent: [...existingSlugs],
  });
}
