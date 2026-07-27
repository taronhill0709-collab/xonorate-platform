"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

export async function updatePassword(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Sign in to change your password." };
  }

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) {
    return { success: false, error: "Account not found." };
  }

  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return { success: false, error: "Enter your current password." };
    }
    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, session.user.id));

  return { success: true };
}
