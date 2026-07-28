"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SOCIAL_POSTS_COOKIE } from "./constants";
import { requireAdmin } from "@/lib/require-admin";

export async function setSocialPostsEnabled(enabled: boolean) {
  await requireAdmin();
  const store = await cookies();
  store.set(SOCIAL_POSTS_COOKIE, enabled ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/admin",
  });
  revalidatePath("/admin/social");
}
