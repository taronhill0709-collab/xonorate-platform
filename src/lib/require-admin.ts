import { auth } from "@/auth";

/** Defense in depth for Server Actions — proxy.ts gates /admin/* pages, but actions need their own check. */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}
