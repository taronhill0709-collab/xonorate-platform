import crypto from "node:crypto";
import { db } from "@/db";
import { supportLetterRequests, lovedOnes, families, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { sendMail } from "@/lib/email";
import { generateSupportLetterDraft } from "@/family/ai/support-letter";
import type { SupportLetterAnswers } from "@/family/support-letters";
import type { SupportLetterPurpose } from "@/family/support-letters-types";

const REQUEST_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

// --- Family-side (requires an active family member) ---

export async function createLetterRequest(params: {
  familyId: string;
  lovedOneId: string;
  requestedByUserId: string;
  purpose: SupportLetterPurpose;
  recipientName?: string | null;
  inviteeName: string;
  inviteeEmail: string;
  personalNote?: string | null;
  inviteUrl: (token: string) => string;
}) {
  const [lovedOne] = await db
    .select({ name: lovedOnes.name, preferredName: lovedOnes.preferredName })
    .from(lovedOnes)
    .where(eq(lovedOnes.id, params.lovedOneId))
    .limit(1);
  const [requester] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, params.requestedByUserId))
    .limit(1);

  const token = crypto.randomBytes(24).toString("hex");
  const tokenExpires = new Date(Date.now() + REQUEST_EXPIRY_MS);
  const lovedOneName = lovedOne?.preferredName || lovedOne?.name || "their loved one";
  const requesterName = requester?.name || requester?.email || "A family member";

  const [row] = await db
    .insert(supportLetterRequests)
    .values({
      familyId: params.familyId,
      lovedOneId: params.lovedOneId,
      requestedByUserId: params.requestedByUserId,
      purpose: params.purpose,
      recipientName: params.recipientName ?? null,
      inviteeName: params.inviteeName,
      inviteeEmail: params.inviteeEmail,
      personalNote: params.personalNote ?? null,
      token,
      tokenExpires,
    })
    .returning();

  const url = params.inviteUrl(token);
  await sendMail({
    to: params.inviteeEmail,
    subject: `${requesterName} invited you to write a support letter for ${lovedOneName}`,
    text: `${requesterName} invited you to write a support letter for ${lovedOneName} through Xonorate Family.\n\n${params.personalNote ? `${params.personalNote}\n\n` : ""}You'll answer a few simple questions in your own words, and we'll help you turn them into a complete letter — you'll review and approve it yourself before it's shared with the family. No account is required.\n\nGet started: ${url}\n\nThis link expires in 14 days.`,
    html: `<p>${requesterName} invited you to write a support letter for ${lovedOneName} through Xonorate Family.</p>${params.personalNote ? `<p>${params.personalNote}</p>` : ""}<p>You'll answer a few simple questions in your own words, and we'll help you turn them into a complete letter — you'll review and approve it yourself before it's shared with the family. No account is required.</p><p><a href="${url}">Get started</a></p><p style="color:#666;font-size:12px;">This link expires in 14 days.</p>`,
  });

  return row;
}

export async function listLetterRequestsForFamily(familyId: string) {
  return db
    .select({
      id: supportLetterRequests.id,
      lovedOneId: supportLetterRequests.lovedOneId,
      lovedOneName: lovedOnes.name,
      requestedByUserId: supportLetterRequests.requestedByUserId,
      purpose: supportLetterRequests.purpose,
      recipientName: supportLetterRequests.recipientName,
      inviteeName: supportLetterRequests.inviteeName,
      inviteeEmail: supportLetterRequests.inviteeEmail,
      status: supportLetterRequests.status,
      finalContent: supportLetterRequests.finalContent,
      draftContent: supportLetterRequests.draftContent,
      createdAt: supportLetterRequests.createdAt,
    })
    .from(supportLetterRequests)
    .innerJoin(lovedOnes, eq(supportLetterRequests.lovedOneId, lovedOnes.id))
    .where(eq(supportLetterRequests.familyId, familyId))
    .orderBy(desc(supportLetterRequests.createdAt));
}

/** Only the family member who sent the request can cancel it — same author-scoping shape as everything else in Family, applied to "who owns this request" rather than "who wrote this letter." */
export async function deleteLetterRequest(
  familyId: string,
  requestId: string,
  requestedByUserId: string,
) {
  const [row] = await db
    .delete(supportLetterRequests)
    .where(
      and(
        eq(supportLetterRequests.id, requestId),
        eq(supportLetterRequests.familyId, familyId),
        eq(supportLetterRequests.requestedByUserId, requestedByUserId),
      ),
    )
    .returning({ id: supportLetterRequests.id });
  return row ?? null;
}

// --- Public, token-authenticated (no login, no family membership) ---
// Every function below takes ONLY a token — never a familyId/lovedOneId
// from the client — and resolves everything it needs from the row that
// token matches. This is the most exposed surface in Family so far: an
// unguessable token (crypto.randomBytes(24), same as everywhere else in
// this codebase) is the entire authorization, by design, because the
// invitee has no account. See docs/SECURITY.md.

export type LetterRequestLookup =
  | {
      valid: true;
      id: string;
      lovedOneName: string;
      familyName: string;
      purpose: SupportLetterPurpose;
      recipientName: string | null;
      inviteeName: string;
      personalNote: string | null;
      answers: SupportLetterAnswers;
      draftContent: string | null;
      finalContent: string | null;
      status: "pending" | "answered" | "approved";
    }
  | { valid: false; reason: "not_found" | "expired" };

export async function lookupLetterRequestToken(token: string): Promise<LetterRequestLookup> {
  const [row] = await db
    .select({
      id: supportLetterRequests.id,
      lovedOneName: lovedOnes.name,
      lovedOnePreferredName: lovedOnes.preferredName,
      familyName: families.name,
      purpose: supportLetterRequests.purpose,
      recipientName: supportLetterRequests.recipientName,
      inviteeName: supportLetterRequests.inviteeName,
      personalNote: supportLetterRequests.personalNote,
      answers: supportLetterRequests.answers,
      draftContent: supportLetterRequests.draftContent,
      finalContent: supportLetterRequests.finalContent,
      status: supportLetterRequests.status,
      tokenExpires: supportLetterRequests.tokenExpires,
    })
    .from(supportLetterRequests)
    .innerJoin(lovedOnes, eq(supportLetterRequests.lovedOneId, lovedOnes.id))
    .innerJoin(families, eq(supportLetterRequests.familyId, families.id))
    .where(eq(supportLetterRequests.token, token))
    .limit(1);

  if (!row) return { valid: false, reason: "not_found" };
  if (row.tokenExpires.getTime() < Date.now()) return { valid: false, reason: "expired" };

  return {
    valid: true,
    id: row.id,
    lovedOneName: row.lovedOnePreferredName || row.lovedOneName,
    familyName: row.familyName,
    purpose: row.purpose as SupportLetterPurpose,
    recipientName: row.recipientName,
    inviteeName: row.inviteeName,
    personalNote: row.personalNote,
    answers: (row.answers as SupportLetterAnswers | null) ?? {},
    draftContent: row.draftContent,
    finalContent: row.finalContent,
    status: row.status,
  };
}

async function requireValidToken(token: string) {
  const lookup = await lookupLetterRequestToken(token);
  if (!lookup.valid) return null;
  return lookup;
}

export async function saveLetterRequestAnswers(token: string, answers: SupportLetterAnswers) {
  const lookup = await requireValidToken(token);
  if (!lookup) return null;

  const [row] = await db
    .update(supportLetterRequests)
    .set({ answers, updatedAt: new Date() })
    .where(eq(supportLetterRequests.token, token))
    .returning({ id: supportLetterRequests.id });
  return row ?? null;
}

export async function generateLetterRequestDraft(token: string) {
  const lookup = await requireValidToken(token);
  if (!lookup) return null;

  const letterContent = await generateSupportLetterDraft({
    purpose: lookup.purpose,
    recipientName: lookup.recipientName,
    lovedOneName: lookup.lovedOneName,
    authorName: lookup.inviteeName,
    answers: lookup.answers,
  });

  const [row] = await db
    .update(supportLetterRequests)
    .set({
      draftContent: letterContent,
      // Same reasoning as regenerateSupportLetterDraft in
      // support-letters.ts: finalContent must not keep winning over a
      // fresh regeneration.
      finalContent: null,
      status: "answered",
      updatedAt: new Date(),
    })
    .where(eq(supportLetterRequests.token, token))
    .returning();
  return row ?? null;
}

export async function updateLetterRequestContent(token: string, finalContent: string) {
  const lookup = await requireValidToken(token);
  if (!lookup) return null;

  const [row] = await db
    .update(supportLetterRequests)
    .set({ finalContent, updatedAt: new Date() })
    .where(eq(supportLetterRequests.token, token))
    .returning({ id: supportLetterRequests.id });
  return row ?? null;
}

/** The invitee approving their own letter — see spec: "the person who is supposedly authoring the letter must have the opportunity to review and approve it." Notifies the family member who sent the request. */
export async function approveLetterRequest(token: string) {
  const lookup = await requireValidToken(token);
  if (!lookup) return null;

  const [row] = await db
    .update(supportLetterRequests)
    .set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(supportLetterRequests.token, token))
    .returning();
  if (!row) return null;

  const [requester] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, row.requestedByUserId))
    .limit(1);
  if (requester?.email) {
    await sendMail({
      to: requester.email,
      subject: `${lookup.inviteeName} completed their support letter`,
      text: `${lookup.inviteeName} has reviewed and approved their support letter for ${lookup.lovedOneName}. You can see it in your family's Support Letters list on Xonorate Family.`,
      html: `<p>${lookup.inviteeName} has reviewed and approved their support letter for ${lookup.lovedOneName}. You can see it in your family's Support Letters list on Xonorate Family.</p>`,
    });
  }

  return row;
}
