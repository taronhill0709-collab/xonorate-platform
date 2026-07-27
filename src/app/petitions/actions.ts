"use server";

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { petitions, signatures } from "@/db/schema";
import { sendMail } from "@/lib/email";
import { isSignatureRateLimited } from "@/lib/rate-limit";
import { getClientIp, getOrigin } from "@/lib/request-ip";

const signSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.email(),
  comment: z.string().trim().max(2000).optional(),
});

export async function signPetition(
  petitionId: string,
  formData: FormData,
): Promise<
  { success: true; alreadyVerified: boolean } | { success: false; error: string }
> {
  // Logged-in supporters skip email double opt-in — their account email is
  // already vetted, so their signature counts immediately. Guests still
  // need to confirm via email.
  const session = await auth();

  const raw = Object.fromEntries(formData.entries());
  const parsed = signSchema.safeParse(
    session?.user ? { ...raw, email: session.user.email } : raw,
  );
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid name and email." };
  }
  const { displayName, email, comment } = parsed.data;

  const ip = await getClientIp();
  if (await isSignatureRateLimited(ip)) {
    return {
      success: false,
      error: "Too many attempts from this connection. Please try again later.",
    };
  }

  const [petition] = await db
    .select({ id: petitions.id, title: petitions.title })
    .from(petitions)
    .where(eq(petitions.id, petitionId))
    .limit(1);
  if (!petition) {
    return { success: false, error: "This petition no longer exists." };
  }

  const [existing] = await db
    .select({ verified: signatures.verified })
    .from(signatures)
    .where(and(eq(signatures.petitionId, petitionId), eq(signatures.email, email)))
    .limit(1);
  if (existing?.verified) {
    return { success: false, error: "This email has already signed." };
  }

  if (session?.user) {
    await db
      .insert(signatures)
      .values({
        petitionId,
        email,
        displayName,
        comment: comment || null,
        ipAddress: ip,
        userId: session.user.id,
        verified: true,
      })
      .onConflictDoUpdate({
        target: [signatures.petitionId, signatures.email],
        set: {
          displayName,
          comment: comment || null,
          ipAddress: ip,
          userId: session.user.id,
          verified: true,
          confirmToken: null,
          confirmTokenExpires: null,
        },
      });

    return { success: true, alreadyVerified: true };
  }

  const confirmToken = crypto.randomBytes(24).toString("hex");
  const confirmTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Re-signing with an unconfirmed email refreshes the token (lets someone
  // who lost the first email request a new one) without duplicating rows —
  // the (petition_id, email) unique index makes this an upsert.
  await db
    .insert(signatures)
    .values({
      petitionId,
      email,
      displayName,
      comment: comment || null,
      ipAddress: ip,
      confirmToken,
      confirmTokenExpires,
    })
    .onConflictDoUpdate({
      target: [signatures.petitionId, signatures.email],
      set: {
        displayName,
        comment: comment || null,
        ipAddress: ip,
        confirmToken,
        confirmTokenExpires,
      },
    });

  const origin = await getOrigin();
  const confirmUrl = `${origin}/api/signatures/confirm?token=${confirmToken}`;

  await sendMail({
    to: email,
    subject: `Confirm your signature: ${petition.title}`,
    text: `Please confirm your signature on "${petition.title}" by visiting:\n${confirmUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Please confirm your signature on <strong>${petition.title}</strong>:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });

  return { success: true, alreadyVerified: false };
}
