"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function approvePost(postId: string) {
  await requireAdmin();
  await db
    .update(posts)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(posts.id, postId));
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}`);
  redirect(`/admin/posts/${postId}?saved=1`);
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/admin/posts");
  redirect("/admin/posts?saved=deleted");
}

/** Moves a post one spot up or down in the admin/public display order.
 * Rewrites sortOrder for every post as its index in the new order rather
 * than swapping the two raw values, since most rows share the same
 * default (0) until the first reorder happens — a plain swap between two
 * equal values would silently do nothing. */
export async function movePost(postId: string, direction: "up" | "down") {
  await requireAdmin();

  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .orderBy(asc(posts.sortOrder), desc(posts.createdAt));
  const ids = rows.map((r) => r.id);

  const index = ids.indexOf(postId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= ids.length) return;

  [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
  await Promise.all(ids.map((id, i) => db.update(posts).set({ sortOrder: i }).where(eq(posts.id, id))));

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  revalidatePath("/");
}
