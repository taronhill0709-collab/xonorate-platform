"use server";

import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { cases, comments, petitions } from "@/db/schema";
import { isCommentRateLimited } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

// Supporters are auto-approved after this many previously published
// comments — first-timers (and anyone below the threshold) go to the
// moderation queue.
const AUTO_APPROVE_AFTER_PUBLISHED_COMMENTS = 3;

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function submitComment(
  targetType: "case" | "petition",
  targetId: string,
  formData: FormData,
): Promise<{ success: true; published: boolean } | { success: false; error: string }> {
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
      : (
          await db
            .select({ id: petitions.id })
            .from(petitions)
            .where(eq(petitions.id, targetId))
            .limit(1)
        ).length > 0;
  if (!targetExists) {
    return { success: false, error: "This item no longer exists." };
  }

  const [{ value: publishedCount }] = await db
    .select({ value: count() })
    .from(comments)
    .where(and(eq(comments.userId, session.user.id), eq(comments.status, "published")));
  const autoApprove = publishedCount >= AUTO_APPROVE_AFTER_PUBLISHED_COMMENTS;

  await db.insert(comments).values({
    targetType,
    targetId,
    userId: session.user.id,
    body,
    status: autoApprove ? "published" : "pending",
    ipAddress: ip,
  });

  return { success: true, published: autoApprove };
}
