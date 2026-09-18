"use server";

import { auth } from "@/auth";
import { acceptInvite, type InviteResult } from "@/family/invites";

export async function acceptInviteAction(token: string): Promise<InviteResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Please log in and try again." };
  }
  return acceptInvite(token, session.user.id, session.user.email);
}
