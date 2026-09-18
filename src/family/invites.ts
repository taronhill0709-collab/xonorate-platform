import crypto from "node:crypto";
import { db } from "@/db";
import { familyMembers, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sendMail } from "@/lib/email";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteResult =
  | { success: true }
  | { success: false; error: string };

export async function listFamilyMembers(familyId: string) {
  return db
    .select({
      id: familyMembers.id,
      role: familyMembers.role,
      status: familyMembers.status,
      invitedEmail: familyMembers.invitedEmail,
      userEmail: users.email,
      userName: users.name,
      createdAt: familyMembers.createdAt,
    })
    .from(familyMembers)
    .leftJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId));
}

/**
 * Always creates a fresh "invited" row with a token, even if the invitee
 * already has an Xonorate account — they still explicitly accept via the
 * emailed link (same double opt-in spirit as petition signature
 * confirmation) rather than being silently added.
 */
export async function inviteFamilyMember(params: {
  familyId: string;
  familyName: string;
  email: string;
  role: "owner" | "member";
  inviteUrl: (token: string) => string;
}): Promise<InviteResult> {
  const email = params.email.trim().toLowerCase();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [existingMembership] = await db
      .select({ id: familyMembers.id, status: familyMembers.status })
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.familyId, params.familyId),
          eq(familyMembers.userId, existingUser.id),
        ),
      )
      .limit(1);
    if (existingMembership?.status === "active") {
      return { success: false, error: "This person is already a family member." };
    }
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteTokenExpires = new Date(Date.now() + INVITE_EXPIRY_MS);

  await db.insert(familyMembers).values({
    familyId: params.familyId,
    userId: existingUser?.id ?? null,
    invitedEmail: email,
    role: params.role,
    status: "invited",
    inviteToken,
    inviteTokenExpires,
  });

  const url = params.inviteUrl(inviteToken);
  await sendMail({
    to: email,
    subject: `You've been invited to join ${params.familyName} on Xonorate Family`,
    text: `You've been invited to join "${params.familyName}" on Xonorate Family — a private place to organize support for a loved one.\n\nAccept the invitation: ${url}\n\nThis link expires in 7 days. If you weren't expecting this, you can ignore this email.`,
    html: `<p>You've been invited to join <strong>${params.familyName}</strong> on Xonorate Family — a private place to organize support for a loved one.</p><p><a href="${url}">Accept the invitation</a></p><p style="color:#666;font-size:12px;">This link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>`,
  });

  return { success: true };
}

export type InviteLookup =
  | { valid: true; familyId: string; familyMemberId: string; invitedEmail: string | null }
  | { valid: false; reason: "not_found" | "expired" };

export async function lookupInviteToken(token: string): Promise<InviteLookup> {
  const [row] = await db
    .select({
      id: familyMembers.id,
      familyId: familyMembers.familyId,
      invitedEmail: familyMembers.invitedEmail,
      status: familyMembers.status,
      inviteTokenExpires: familyMembers.inviteTokenExpires,
    })
    .from(familyMembers)
    .where(eq(familyMembers.inviteToken, token))
    .limit(1);

  if (!row || row.status !== "invited") return { valid: false, reason: "not_found" };
  if (row.inviteTokenExpires && row.inviteTokenExpires.getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }
  return {
    valid: true,
    familyId: row.familyId,
    familyMemberId: row.id,
    invitedEmail: row.invitedEmail,
  };
}

/**
 * Requires the logged-in user's own email to match the invite's
 * invitedEmail — without this, anyone who gets hold of a valid token (a
 * forwarded email, a shared link) could claim someone else's invite slot
 * under their own account.
 */
export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string,
): Promise<InviteResult> {
  const lookup = await lookupInviteToken(token);
  if (!lookup.valid) {
    return {
      success: false,
      error:
        lookup.reason === "expired"
          ? "This invitation has expired. Ask the family owner to send a new one."
          : "This invitation link is no longer valid.",
    };
  }
  if (
    lookup.invitedEmail &&
    lookup.invitedEmail.toLowerCase() !== userEmail.trim().toLowerCase()
  ) {
    return {
      success: false,
      error: `This invitation was sent to ${lookup.invitedEmail}. Log in with that email to accept it.`,
    };
  }

  await db
    .update(familyMembers)
    .set({
      userId,
      status: "active",
      inviteToken: null,
      inviteTokenExpires: null,
    })
    .where(eq(familyMembers.id, lookup.familyMemberId));

  return { success: true };
}

export async function removeFamilyMember(familyId: string, familyMemberId: string) {
  const [row] = await db
    .delete(familyMembers)
    .where(
      and(eq(familyMembers.id, familyMemberId), eq(familyMembers.familyId, familyId)),
    )
    .returning({ id: familyMembers.id });
  return row ?? null;
}
