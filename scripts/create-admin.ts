/**
 * Seeds (or promotes) an admin user. There's no public admin signup —
 * Xonorate staff accounts are created this way.
 *
 * Usage: with `netlify dev` running in another terminal, grab its local DB
 * connection string from `npx netlify database status` and run:
 *   DATABASE_URL="postgres://localhost:<port>/postgres" \
 *     npx tsx scripts/create-admin.ts <email> <password> [name]
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      "Usage: create-admin.ts <email> <password> [name]",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
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
    console.log(`Updated existing user ${email} to admin.`);
  } else {
    await db.insert(users).values({
      email,
      name: name ?? email,
      passwordHash,
      role: "admin",
      emailVerified: new Date(),
    });
    console.log(`Created admin user ${email}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
