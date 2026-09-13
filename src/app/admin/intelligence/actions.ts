"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { intelligenceItems } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

/** Marks a discovered item as not worth publishing. Never destructive — kept
 * around (not deleted) so it still counts toward "duplicate"/"low relevance"
 * history and doesn't get rediscovered as new by the dedup check. */
export async function rejectIntelligenceItem(itemId: string) {
  await requireAdmin();
  await db.update(intelligenceItems).set({ status: "rejected" }).where(eq(intelligenceItems.id, itemId));
  revalidatePath("/admin/intelligence");
  revalidatePath("/admin/intelligence/sources");
}

export async function markIntelligenceReviewed(itemId: string) {
  await requireAdmin();
  await db.update(intelligenceItems).set({ status: "reviewed" }).where(eq(intelligenceItems.id, itemId));
  revalidatePath("/admin/intelligence");
  revalidatePath("/admin/intelligence/sources");
}
