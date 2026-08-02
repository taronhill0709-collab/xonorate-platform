"use server";

import { eq } from "drizzle-orm";
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
