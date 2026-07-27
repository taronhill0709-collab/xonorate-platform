import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

// Temporary one-time endpoint for seeding the first production admin
// account — there's no other way to reach the production database from
// outside a Netlify-driven process. Remove this route once the account
// has been created.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-provision-secret");
  if (!process.env.ADMIN_PROVISION_SECRET || secret !== process.env.ADMIN_PROVISION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, password, name } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "invalid email or password" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin", name: name ?? undefined })
      .where(eq(users.id, existing.id));
    return NextResponse.json({ result: "updated existing user to admin" });
  }

  await db.insert(users).values({
    email,
    name: name ?? email,
    passwordHash,
    role: "admin",
    emailVerified: new Date(),
  });
  return NextResponse.json({ result: "created admin user" });
}
