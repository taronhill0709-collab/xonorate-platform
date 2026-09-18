"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createFamilyWithOwner } from "@/family/families";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter a family name.").max(120),
});

export async function createFamily(
  name: string,
): Promise<{ success: true; familyId: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Please log in and try again." };

  const parsed = schema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please enter a family name." };
  }

  const family = await createFamilyWithOwner(session.user.id, parsed.data.name);
  return { success: true, familyId: family.id };
}
