import Link from "next/link";
import { requireFamilyMember } from "@/family/authz";
import { listNotesForFamily } from "@/family/notes";
import { listLovedOnesForFamily } from "@/family/loved-ones";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const membership = await requireFamilyMember(familyId);
  const [notes, lovedOnes] = await Promise.all([
    listNotesForFamily(familyId, membership.session.user.id),
    listLovedOnesForFamily(familyId),
  ]);
  const lovedOneNameById = new Map(lovedOnes.map((lo) => [lo.id, lo.preferredName || lo.name]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Notes</h1>
          <p className="mt-1 text-sm text-muted">
            Private notes are only visible to you. Family notes are visible
            to everyone in this family.
          </p>
        </div>
        <Link
          href={`/family/${familyId}/notes/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Note
        </Link>
      </div>

      {notes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No notes yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Keep track of calls, conversations, and small details — anything
            worth remembering.
          </p>
          <Link
            href={`/family/${familyId}/notes/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add Note
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const isOwn = note.authorUserId === membership.session.user.id;
            return (
              <li key={note.id} className="rounded-2xl border border-border bg-muted-background p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                  {isOwn && (
                    <Link
                      href={`/family/${familyId}/notes/${note.id}/edit`}
                      className="shrink-0 text-xs font-semibold text-brand"
                    >
                      Edit
                    </Link>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      note.visibility === "private"
                        ? "bg-muted-background text-muted ring-1 ring-border"
                        : "bg-brand-light text-brand"
                    }`}
                  >
                    {note.visibility === "private" ? "Private" : "Family"}
                  </span>
                  {note.lovedOneId && <span>{lovedOneNameById.get(note.lovedOneId)}</span>}
                  <span>{isOwn ? "You" : note.authorName || note.authorEmail}</span>
                  <span>
                    {note.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
