import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Every /family/* route is a per-request authenticated view over private,
// live data — never statically prerendered (same reasoning as
// admin/layout.tsx's dynamic export).
export const dynamic = "force-dynamic";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/family");
  }

  return (
    <div className="family-scope min-h-screen bg-background text-foreground">
      <header className="border-b border-header-border bg-header-background px-6 py-4 text-header-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/family" className="font-serif text-xl font-semibold">
            Xonorate <span className="text-brand">Family</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-header-muted transition hover:text-header-foreground"
          >
            Xonorate
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
