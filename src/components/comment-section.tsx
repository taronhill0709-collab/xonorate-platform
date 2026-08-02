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
  targetType: "case" | "petition" | "post";
  targetId: string;
}) {
  const session = await auth();

  const publishedComments = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      pinned: comments.pinned,
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
    .orderBy(desc(comments.pinned), desc(comments.createdAt))
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
            <li
              key={c.id}
              className={
                c.pinned
                  ? "border-l-2 border-brand bg-brand-light/40 py-2 pl-4 text-sm"
                  : "border-l-2 border-border pl-4 text-sm"
              }
            >
              {c.pinned && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand">
                  Pinned
                </p>
              )}
              <p className="text-foreground">{c.body}</p>
              <p className="mt-1 text-muted">— {c.authorName ?? c.authorEmail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
