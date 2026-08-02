import { desc, eq, isNotNull } from "drizzle-orm";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { comments, petitions, signatures, users } from "@/db/schema";
import { COMMENT_STATUS_LABEL, COMMENT_TARGET_LABEL } from "@/lib/comment-status";
import {
  clearSignatureComment,
  deleteComment,
  setCommentStatus,
  toggleCommentPin,
  toggleSignatureCommentPin,
} from "./actions";
import { DeleteCommentButton } from "./delete-comment-button";

export default async function AdminCommentsPage() {
  const rows = await db
    .select({
      id: comments.id,
      targetType: comments.targetType,
      body: comments.body,
      status: comments.status,
      pinned: comments.pinned,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .orderBy(desc(comments.pinned), desc(comments.createdAt));

  const signatureNotes = await db
    .select({
      id: signatures.id,
      comment: signatures.comment,
      pinned: signatures.commentPinned,
      displayName: signatures.displayName,
      createdAt: signatures.createdAt,
      petitionTitle: petitions.title,
    })
    .from(signatures)
    .innerJoin(petitions, eq(signatures.petitionId, petitions.id))
    .where(isNotNull(signatures.comment))
    .orderBy(desc(signatures.commentPinned), desc(signatures.createdAt));

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
                <td className="py-2 text-muted">
                  {COMMENT_TARGET_LABEL[row.targetType] ?? row.targetType}
                </td>
                <td className="max-w-md whitespace-pre-wrap break-words py-2 text-foreground">
                  {row.body}
                </td>
                <td className="py-2">
                  <Badge
                    tone={
                      row.status === "published"
                        ? "brand"
                        : row.status === "removed"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {COMMENT_STATUS_LABEL[row.status] ?? row.status}
                  </Badge>{" "}
                  {row.pinned && <Badge tone="brand">Pinned</Badge>}
                </td>
                <td className="py-2 text-right">
                  <form action={toggleCommentPin.bind(null, row.id, !row.pinned)} className="inline">
                    <button type="submit" className="text-brand underline">
                      {row.pinned ? "Unpin" : "Pin"}
                    </button>
                  </form>{" "}
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
                  )}{" "}
                  <form action={deleteComment.bind(null, row.id)} className="inline">
                    <DeleteCommentButton />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-10 font-serif text-lg text-foreground">Petition sign-up notes</h2>
      <p className="mt-1 text-sm text-muted">
        The optional note someone can leave when signing a petition — shown publicly under
        &quot;Why people are signing&quot; immediately, with no approval step. Remove hides it
        from the public page without deleting their signature.
      </p>
      {signatureNotes.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No sign-up notes yet.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Signer</th>
              <th className="py-2 font-medium">Petition</th>
              <th className="py-2 font-medium">Note</th>
              <th className="py-2 font-medium" />
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {signatureNotes.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">{row.displayName}</td>
                <td className="py-2 text-muted">{row.petitionTitle}</td>
                <td className="max-w-md whitespace-pre-wrap break-words py-2 text-foreground">
                  {row.comment}
                </td>
                <td className="py-2">{row.pinned && <Badge tone="brand">Pinned</Badge>}</td>
                <td className="py-2 text-right">
                  <form
                    action={toggleSignatureCommentPin.bind(null, row.id, !row.pinned)}
                    className="inline"
                  >
                    <button type="submit" className="text-brand underline">
                      {row.pinned ? "Unpin" : "Pin"}
                    </button>
                  </form>{" "}
                  <form action={clearSignatureComment.bind(null, row.id)} className="inline">
                    <button type="submit" className="text-red-600 underline">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
