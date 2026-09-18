import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getOwnNoteForFamily } from "@/family/notes";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import type { NoteVisibility } from "@/family/notes-types";
import { EditNoteForm } from "./edit-note-form";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ familyId: string; noteId: string }>;
}) {
  const { familyId, noteId } = await params;
  const membership = await requireFamilyMember(familyId);

  // Scoped to the caller being the note's own author — indistinguishable
  // from "doesn't exist" for anyone else, including another active member
  // of the same family. See notes.ts's getOwnNoteForFamily comment.
  const [note, lovedOnes] = await Promise.all([
    getOwnNoteForFamily(familyId, noteId, membership.session.user.id),
    listLovedOnesForFamily(familyId),
  ]);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl">Edit Note</h1>
      <EditNoteForm
        familyId={familyId}
        noteId={noteId}
        body={note.body}
        visibility={note.visibility as NoteVisibility}
        lovedOneId={note.lovedOneId}
        lovedOnes={lovedOnes.map((lo) => ({ id: lo.id, name: lo.preferredName || lo.name }))}
      />
    </div>
  );
}
