import { db } from "@/db";
import { familyNotes, users } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import type { NoteVisibility } from "@/family/notes-types";

export type NoteInput = {
  lovedOneId?: string | null;
  body: string;
  visibility: NoteVisibility;
};

export async function createNote(familyId: string, authorUserId: string, input: NoteInput) {
  const [row] = await db
    .insert(familyNotes)
    .values({ familyId, authorUserId, ...input })
    .returning();
  return row;
}

/**
 * Visibility-aware: a private note is only ever included when the viewer
 * is its author — this filter happens in the query itself, not by
 * fetching everything and hiding rows in the UI, since a page that never
 * even receives another member's private note is the only way to be sure
 * it's never rendered, logged, or leaked by a future UI change.
 */
export async function listNotesForFamily(
  familyId: string,
  viewerUserId: string,
  filter?: { lovedOneId?: string },
) {
  const visibleToViewer = and(
    eq(familyNotes.familyId, familyId),
    or(eq(familyNotes.visibility, "family"), eq(familyNotes.authorUserId, viewerUserId)),
    filter?.lovedOneId ? eq(familyNotes.lovedOneId, filter.lovedOneId) : undefined,
  );

  return db
    .select({
      id: familyNotes.id,
      lovedOneId: familyNotes.lovedOneId,
      body: familyNotes.body,
      visibility: familyNotes.visibility,
      authorUserId: familyNotes.authorUserId,
      authorName: users.name,
      authorEmail: users.email,
      createdAt: familyNotes.createdAt,
    })
    .from(familyNotes)
    .leftJoin(users, eq(familyNotes.authorUserId, users.id))
    .where(visibleToViewer)
    .orderBy(desc(familyNotes.createdAt));
}

/**
 * Scoped to the caller being the note's own author, not just a member of
 * the family — used to load a note for editing. A non-author hitting this
 * (even for a "family"-visibility note they're otherwise allowed to read
 * in the list) gets null, same as a note that doesn't exist: only the
 * author can edit or delete their own note, regardless of who can read it.
 */
export async function getOwnNoteForFamily(
  familyId: string,
  noteId: string,
  authorUserId: string,
) {
  const [row] = await db
    .select()
    .from(familyNotes)
    .where(
      and(
        eq(familyNotes.id, noteId),
        eq(familyNotes.familyId, familyId),
        eq(familyNotes.authorUserId, authorUserId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateNote(
  familyId: string,
  noteId: string,
  authorUserId: string,
  input: Partial<NoteInput>,
) {
  const [row] = await db
    .update(familyNotes)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(familyNotes.id, noteId),
        eq(familyNotes.familyId, familyId),
        eq(familyNotes.authorUserId, authorUserId),
      ),
    )
    .returning({ id: familyNotes.id });
  return row ?? null;
}

export async function deleteNote(familyId: string, noteId: string, authorUserId: string) {
  const [row] = await db
    .delete(familyNotes)
    .where(
      and(
        eq(familyNotes.id, noteId),
        eq(familyNotes.familyId, familyId),
        eq(familyNotes.authorUserId, authorUserId),
      ),
    )
    .returning({ id: familyNotes.id });
  return row ?? null;
}
