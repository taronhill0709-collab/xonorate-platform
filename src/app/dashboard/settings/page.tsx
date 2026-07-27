import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Account settings",
};

// Reflects the account's live password state right after a change.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/settings");
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Account settings</h1>
        <p className="mt-2 text-sm text-muted">{session.user.email}</p>

        <div className="mt-8">
          <SettingsForm hasPassword={!!user?.passwordHash} />
        </div>
      </main>
    </>
  );
}
