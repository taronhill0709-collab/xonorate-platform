"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { cases, comments, petitions, posts } from "@/db/schema";
import { isCommentRateLimited } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

// Comments publish immediately — rate limiting is the spam defense, and
// admins moderate reactively (Remove/Delete in /admin/comments) rather than
// pre-approving everything, so the queue doesn't pile up with routine posts.
export async function submitComment(
  targetType: "case" | "petition" | "post",
  targetId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Sign in to leave a comment." };
  }

  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: "Please write a comment before posting." };
  }
  const { body } = parsed.data;

  const ip = await getClientIp();
  if (await isCommentRateLimited(ip)) {
    return {
      success: false,
      error: "Too many comments from this connection. Please try again later.",
    };
  }

  const targetExists =
    targetType === "case"
      ? (await db.select({ id: cases.id }).from(cases).where(eq(cases.id, targetId)).limit(1))
          .length > 0
      : targetType === "petition"
        ? (
            await db
              .select({ id: petitions.id })
              .from(petitions)
              .where(and(eq(petitions.id, targetId), eq(petitions.status, "published")))
              .limit(1)
          ).length > 0
        : (
            await db
              .select({ id: posts.id })
              .from(posts)
              .where(and(eq(posts.id, targetId), eq(posts.status, "published")))
              .limit(1)
          ).length > 0;
  if (!targetExists) {
    return { success: false, error: "This item no longer exists." };
  }

  await db.insert(comments).values({
    targetType,
    targetId,
    userId: session.user.id,
    body,
    status: "published",
    ipAddress: ip,
  });

  return { success: true };
}
