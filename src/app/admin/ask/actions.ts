"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { askQuestions } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

/** Ask Xonorate's question/answer log is telemetry, not editorial content
 * — nothing here needs to be kept permanently, so editors can clear rows
 * once they've been reviewed (a closed research gap, a flag that's been
 * addressed, or just routine cleanup). */
export async function deleteAskQuestion(questionId: string) {
  await requireAdmin();
  await db.delete(askQuestions).where(eq(askQuestions.id, questionId));
  revalidatePath("/admin/ask");
}
