import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/auth";
import { CommentForm } from "@/components/comment-form";
import { db } from "@/db";
import { comments, users } from "@/db/schema";

export async function CommentSection({
  targetType,
  targetId,
}: {
  targetType: "case" | "petition";
  targetId: string;
}) {
  const session = await auth();

  const publishedComments = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(
      and(
        eq(comments.targetType, targetType),
        eq(comments.targetId, targetId),
        eq(comments.status, "published"),
      ),
    )
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return (
    <section className="mt-10">
      <h2 className="font-serif text-lg text-foreground">Comments</h2>

      <div className="mt-4">
        {session?.user ? (
          <CommentForm targetType={targetType} targetId={targetId} />
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="text-brand underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}
      </div>

      {publishedComments.length > 0 && (
        <ul className="mt-6 space-y-4">
          {publishedComments.map((c) => (
            <li key={c.id} className="border-l-2 border-border pl-4 text-sm">
              <p className="text-foreground">{c.body}</p>
              <p className="mt-1 text-muted">— {c.authorName ?? c.authorEmail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
