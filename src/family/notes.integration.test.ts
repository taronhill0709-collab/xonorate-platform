// Real-database tests for family notes: the usual cross-family guard
// (same pattern as loved-ones/calendar/documents), plus a second dimension
// unique to notes — a "private" note must never be visible to another
// active member of the SAME family, and only its author may edit or
// delete it regardless of its visibility.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("family notes authorization", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let notesLib: typeof import("./notes");

  let familyA: string, familyB: string;
  let authorA: string, otherMemberA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    notesLib = await import("./notes");

    const [author, other] = await db
      .insert(schema.users)
      .values([
        { email: `test-note-author-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-note-other-${Date.now()}@example.test`, role: "supporter" },
      ])
      .returning({ id: schema.users.id });
    authorA = author.id;
    otherMemberA = other.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Notes Test Family A", ownerUserId: authorA },
        { name: "Notes Test Family B", ownerUserId: authorA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    await db.insert(schema.familyMembers).values([
      { familyId: familyA, userId: authorA, role: "owner", status: "active" },
      { familyId: familyA, userId: otherMemberA, role: "member", status: "active" },
    ]);
  });

  afterAll(async () => {
    await db.delete(schema.familyNotes).where(eq(schema.familyNotes.familyId, familyA));
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, authorA));
    await db.delete(schema.users).where(eq(schema.users.id, otherMemberA));
  });

  it("shows a family-visibility note to every viewer in the family", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Family note",
      visibility: "family",
    });
    const seenByOther = await notesLib.listNotesForFamily(familyA, otherMemberA);
    expect(seenByOther.map((n) => n.id)).toContain(note.id);
  });

  it("hides a private note from another family member", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Private note",
      visibility: "private",
    });

    const seenByAuthor = await notesLib.listNotesForFamily(familyA, authorA);
    expect(seenByAuthor.map((n) => n.id)).toContain(note.id);

    const seenByOther = await notesLib.listNotesForFamily(familyA, otherMemberA);
    expect(seenByOther.map((n) => n.id)).not.toContain(note.id);
  });

  it("does not scope notes to a different family", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Family A note",
      visibility: "family",
    });
    const seenInFamilyB = await notesLib.listNotesForFamily(familyB, authorA);
    expect(seenInFamilyB.map((n) => n.id)).not.toContain(note.id);
  });

  it("only lets the author load their own note for editing", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Editable by author only",
      visibility: "family",
    });

    const asAuthor = await notesLib.getOwnNoteForFamily(familyA, note.id, authorA);
    expect(asAuthor?.id).toBe(note.id);

    const asOtherMember = await notesLib.getOwnNoteForFamily(familyA, note.id, otherMemberA);
    expect(asOtherMember).toBeNull();
  });

  it("refuses to update another member's note, even a family-visibility one", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Original body",
      visibility: "family",
    });

    const result = await notesLib.updateNote(familyA, note.id, otherMemberA, {
      body: "Hijacked body",
    });
    expect(result).toBeNull();

    const unchanged = await notesLib.getOwnNoteForFamily(familyA, note.id, authorA);
    expect(unchanged?.body).toBe("Original body");
  });

  it("refuses to delete another member's note", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Should survive",
      visibility: "family",
    });

    const result = await notesLib.deleteNote(familyA, note.id, otherMemberA);
    expect(result).toBeNull();

    const stillThere = await notesLib.getOwnNoteForFamily(familyA, note.id, authorA);
    expect(stillThere).not.toBeNull();
  });

  it("lets the author update and delete their own note", async () => {
    const note = await notesLib.createNote(familyA, authorA, {
      body: "Will be edited",
      visibility: "family",
    });

    const updateResult = await notesLib.updateNote(familyA, note.id, authorA, {
      body: "Edited body",
    });
    expect(updateResult?.id).toBe(note.id);

    const deleteResult = await notesLib.deleteNote(familyA, note.id, authorA);
    expect(deleteResult?.id).toBe(note.id);
  });
});
