"use server";

import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

const schema = z.object({ email: z.email() });

/** Silently no-ops on a repeat email (unique constraint) rather than
 * erroring — an already-subscribed visitor should see the same success
 * state as a new one, not learn their email is already on the list. */
export async function subscribeToNewsletter(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email." };
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email })
    .onConflictDoNothing();

  return { success: true };
}
