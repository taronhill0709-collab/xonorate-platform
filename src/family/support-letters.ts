import { db } from "@/db";
import { supportLetters, lovedOnes, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { generateSupportLetterDraft } from "@/family/ai/support-letter";
import type { SupportLetterPurpose } from "@/family/support-letters-types";

export type SupportLetterAnswers = Record<string, string>;

// Re-exported for server-side callers (list/detail pages) that already
// import this file for the DB functions — client components must import
// this from @/family/support-letters-types directly instead.
export { getLetterContent } from "@/family/support-letters-types";

export async function createSupportLetterDraft(
  familyId: string,
  lovedOneId: string,
  authorUserId: string,
  input: { purpose: SupportLetterPurpose; recipientName?: string | null },
) {
  const [row] = await db
    .insert(supportLetters)
    .values({
      familyId,
      lovedOneId,
      authorUserId,
      purpose: input.purpose,
      recipientName: input.recipientName ?? null,
    })
    .returning();
  return row;
}

/** Family-wide read — a letter is part of the loved one's shared support packet, unlike private notes. Only mutation is author-scoped (see getOwnSupportLetterForFamily below). */
export async function listSupportLettersForFamily(familyId: string) {
  return db
    .select({
      id: supportLetters.id,
      lovedOneId: supportLetters.lovedOneId,
      lovedOneName: lovedOnes.name,
      authorUserId: supportLetters.authorUserId,
      authorName: users.name,
      authorEmail: users.email,
      purpose: supportLetters.purpose,
      recipientName: supportLetters.recipientName,
      status: supportLetters.status,
      draftContent: supportLetters.draftContent,
      finalContent: supportLetters.finalContent,
      createdAt: supportLetters.createdAt,
    })
    .from(supportLetters)
    .innerJoin(lovedOnes, eq(supportLetters.lovedOneId, lovedOnes.id))
    .innerJoin(users, eq(supportLetters.authorUserId, users.id))
    .where(eq(supportLetters.familyId, familyId))
    .orderBy(desc(supportLetters.createdAt));
}

/**
 * Scoped to the caller being the letter's own author, not just a family
 * member — same reasoning as notes.ts's getOwnNoteForFamily: a letter is
 * written in one person's voice, so only they can answer its questions,
 * regenerate it, edit its content, approve it, or delete it. A non-author
 * gets null, indistinguishable from "doesn't exist."
 */
export async function getOwnSupportLetterForFamily(
  familyId: string,
  letterId: string,
  authorUserId: string,
) {
  const [row] = await db
    .select({
      id: supportLetters.id,
      lovedOneId: supportLetters.lovedOneId,
      lovedOneName: lovedOnes.name,
      purpose: supportLetters.purpose,
      recipientName: supportLetters.recipientName,
      answers: supportLetters.answers,
      draftContent: supportLetters.draftContent,
      finalContent: supportLetters.finalContent,
      status: supportLetters.status,
    })
    .from(supportLetters)
    .innerJoin(lovedOnes, eq(supportLetters.lovedOneId, lovedOnes.id))
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateSupportLetterAnswers(
  familyId: string,
  letterId: string,
  authorUserId: string,
  answers: SupportLetterAnswers,
) {
  const [row] = await db
    .update(supportLetters)
    .set({ answers, updatedAt: new Date() })
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .returning({ id: supportLetters.id });
  return row ?? null;
}

/** The one place this tool calls the AI — see docs/AI.md for the context rule this follows (only the author's own answers + the loved one's name, nothing else from the family's data is sent). */
export async function regenerateSupportLetterDraft(
  familyId: string,
  letterId: string,
  authorUserId: string,
  authorName: string,
) {
  const letter = await getOwnSupportLetterForFamily(familyId, letterId, authorUserId);
  if (!letter) return null;

  const letterContent = await generateSupportLetterDraft({
    purpose: letter.purpose as SupportLetterPurpose,
    recipientName: letter.recipientName,
    lovedOneName: letter.lovedOneName,
    authorName,
    answers: (letter.answers as SupportLetterAnswers | null) ?? {},
  });

  const [row] = await db
    .update(supportLetters)
    .set({
      draftContent: letterContent,
      // A fresh regeneration must actually be what the author sees next —
      // getLetterContent() prefers finalContent over draftContent, so
      // leaving a prior edited version in place here would mean
      // "Regenerate" silently did nothing from the author's point of
      // view. The client warns before calling this when finalContent
      // already exists (see letter-workflow.tsx).
      finalContent: null,
      status: "generated",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function updateSupportLetterContent(
  familyId: string,
  letterId: string,
  authorUserId: string,
  finalContent: string,
) {
  const [row] = await db
    .update(supportLetters)
    .set({ finalContent, updatedAt: new Date() })
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .returning({ id: supportLetters.id });
  return row ?? null;
}

export async function approveSupportLetter(familyId: string, letterId: string, authorUserId: string) {
  const [row] = await db
    .update(supportLetters)
    .set({ status: "approved", updatedAt: new Date() })
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .returning({ id: supportLetters.id });
  return row ?? null;
}

export async function deleteSupportLetter(familyId: string, letterId: string, authorUserId: string) {
  const [row] = await db
    .delete(supportLetters)
    .where(
      and(
        eq(supportLetters.id, letterId),
        eq(supportLetters.familyId, familyId),
        eq(supportLetters.authorUserId, authorUserId),
      ),
    )
    .returning({ id: supportLetters.id });
  return row ?? null;
}
