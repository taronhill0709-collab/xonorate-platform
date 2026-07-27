import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { setCommentStatus } from "./actions";

export default async function AdminCommentsPage() {
  const rows = await db
    .select({
      id: comments.id,
      targetType: comments.targetType,
      body: comments.body,
      status: comments.status,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .orderBy(desc(comments.createdAt));

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Comment moderation</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No comments yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Author</th>
              <th className="py-2 font-medium">Target</th>
              <th className="py-2 font-medium">Body</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">{row.authorName ?? row.authorEmail}</td>
                <td className="py-2 text-foreground">{row.targetType}</td>
                <td className="max-w-xs truncate py-2 text-foreground">{row.body}</td>
                <td className="py-2 text-foreground">{row.status}</td>
                <td className="py-2 text-right">
                  {row.status !== "published" && (
                    <form
                      action={setCommentStatus.bind(null, row.id, "published")}
                      className="inline"
                    >
                      <button type="submit" className="text-brand underline">
                        Approve
                      </button>
                    </form>
                  )}{" "}
                  {row.status !== "removed" && (
                    <form
                      action={setCommentStatus.bind(null, row.id, "removed")}
                      className="inline"
                    >
                      <button type="submit" className="text-red-600 underline">
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
