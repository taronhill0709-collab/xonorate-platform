// Real-database tests for support letters: the usual cross-family guard,
// plus a pattern distinct from notes.ts — letters are family-wide
// READABLE (they're part of the loved one's shared support packet, not a
// private aside) but author-scoped for every WRITE (a letter is written
// in one person's voice; only they can answer its questions, regenerate,
// edit, approve, or delete it). Does not exercise the actual AI call
// (regenerateSupportLetterDraft) — that needs a live ANTHROPIC_API_KEY and
// was verified manually instead, the same way the document vault's real
// storage round trip was.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("support letter authorization", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let lettersLib: typeof import("./support-letters");

  let familyA: string, familyB: string;
  let author: string, otherMemberA: string;
  let lovedOneId: string;
  let letterId: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    lettersLib = await import("./support-letters");

    const [authorUser, otherUser] = await db
      .insert(schema.users)
      .values([
        { email: `test-letter-author-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-letter-other-${Date.now()}@example.test`, role: "supporter" },
      ])
      .returning({ id: schema.users.id });
    author = authorUser.id;
    otherMemberA = otherUser.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Letter Test Family A", ownerUserId: author },
        { name: "Letter Test Family B", ownerUserId: author },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    await db.insert(schema.familyMembers).values([
      { familyId: familyA, userId: author, role: "owner", status: "active" },
      { familyId: familyA, userId: otherMemberA, role: "member", status: "active" },
    ]);

    const [lovedOne] = await db
      .insert(schema.lovedOnes)
      .values({ familyId: familyA, name: "Test Loved One" })
      .returning({ id: schema.lovedOnes.id });
    lovedOneId = lovedOne.id;

    const letter = await lettersLib.createSupportLetterDraft(familyA, lovedOneId, author, {
      purpose: "family",
    });
    letterId = letter.id;
  });

  afterAll(async () => {
    await db.delete(schema.supportLetters).where(eq(schema.supportLetters.familyId, familyA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.id, lovedOneId));
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, author));
    await db.delete(schema.users).where(eq(schema.users.id, otherMemberA));
  });

  it("lets the author load their own letter", async () => {
    const row = await lettersLib.getOwnSupportLetterForFamily(familyA, letterId, author);
    expect(row?.id).toBe(letterId);
  });

  it("hides the letter from a non-author, even in the same family", async () => {
    const row = await lettersLib.getOwnSupportLetterForFamily(familyA, letterId, otherMemberA);
    expect(row).toBeNull();
  });

  it("hides the letter under a different family entirely", async () => {
    const row = await lettersLib.getOwnSupportLetterForFamily(familyB, letterId, author);
    expect(row).toBeNull();
  });

  it("shows the letter to every active family member in the family-wide list", async () => {
    const seenByOther = await lettersLib.listSupportLettersForFamily(familyA);
    expect(seenByOther.map((l) => l.id)).toContain(letterId);
  });

  it("does not leak the letter into a different family's list", async () => {
    const seenInFamilyB = await lettersLib.listSupportLettersForFamily(familyB);
    expect(seenInFamilyB.map((l) => l.id)).not.toContain(letterId);
  });

  it("refuses to save answers from a non-author", async () => {
    const result = await lettersLib.updateSupportLetterAnswers(familyA, letterId, otherMemberA, {
      relationship: "hijacked",
    });
    expect(result).toBeNull();
  });

  it("lets the author save their own answers", async () => {
    const result = await lettersLib.updateSupportLetterAnswers(familyA, letterId, author, {
      relationship: "I am their sister",
    });
    expect(result?.id).toBe(letterId);
  });

  it("refuses content edits from a non-author", async () => {
    const result = await lettersLib.updateSupportLetterContent(familyA, letterId, otherMemberA, "hijacked");
    expect(result).toBeNull();
  });

  it("refuses approval from a non-author", async () => {
    const result = await lettersLib.approveSupportLetter(familyA, letterId, otherMemberA);
    expect(result).toBeNull();
  });

  it("refuses deletion from a non-author", async () => {
    const result = await lettersLib.deleteSupportLetter(familyA, letterId, otherMemberA);
    expect(result).toBeNull();

    const stillThere = await lettersLib.getOwnSupportLetterForFamily(familyA, letterId, author);
    expect(stillThere).not.toBeNull();
  });
});
