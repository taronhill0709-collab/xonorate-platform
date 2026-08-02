"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { comments, petitions, signatures } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function setCommentStatus(
  commentId: string,
  status: "published" | "removed",
) {
  await requireAdmin();
  await db.update(comments).set({ status }).where(eq(comments.id, commentId));
  revalidatePath("/admin/comments");
  redirect("/admin/comments?saved=1");
}

/** Permanently deletes a comment. Distinct from "Remove", which only sets
 * status to hide it from the public site — the row otherwise stays forever. */
export async function deleteComment(commentId: string) {
  await requireAdmin();
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath("/admin/comments");
  redirect("/admin/comments?saved=deleted");
}

export async function toggleCommentPin(commentId: string, pinned: boolean) {
  await requireAdmin();
  await db.update(comments).set({ pinned }).where(eq(comments.id, commentId));
  revalidatePath("/admin/comments");
  redirect("/admin/comments?saved=1");
}

/** Signing a petition can include a freeform note, shown publicly under
 * "Why people are signing" — unlike comments, this was never moderated or
 * even visible in admin. Clearing it (rather than deleting the signature)
 * hides the note from the public page without removing the person's
 * signature from the count. */
export async function clearSignatureComment(signatureId: string) {
  await requireAdmin();

  const [row] = await db
    .select({ petitionId: signatures.petitionId })
    .from(signatures)
    .where(eq(signatures.id, signatureId))
    .limit(1);

  await db.update(signatures).set({ comment: null }).where(eq(signatures.id, signatureId));

  revalidatePath("/admin/comments");
  if (row) {
    const [petition] = await db
      .select({ slug: petitions.slug })
      .from(petitions)
      .where(eq(petitions.id, row.petitionId))
      .limit(1);
    if (petition) revalidatePath(`/petitions/${petition.slug}`);
  }
  redirect("/admin/comments?saved=1");
}
