"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function setCommentStatus(
  commentId: string,
  status: "published" | "removed",
) {
  await requireAdmin();
  await db.update(comments).set({ status }).where(eq(comments.id, commentId));
  revalidatePath("/admin/comments");
}

/** Permanently deletes a comment. Distinct from "Remove", which only sets
 * status to hide it from the public site — the row otherwise stays forever. */
export async function deleteComment(commentId: string) {
  await requireAdmin();
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath("/admin/comments");
}
