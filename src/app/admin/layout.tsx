import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { SignOutButton } from "./sign-out-button";

// Every /admin/* route is a per-request authenticated view over live data —
// never statically prerendered, so build-time page-data collection doesn't
// attempt to render it (and hit the DB) without a live environment.
export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cases", label: "Cases" },
  { href: "/admin/petitions", label: "Petitions" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/posts", label: "Posts" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Defense in depth: proxy.ts already gates /admin/*, but Server Functions
  // must not rely on it alone (a matcher change could silently drop coverage).
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect(`/login?callbackUrl=/admin`);
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-56 shrink-0 border-r border-border bg-muted-background">
        <div className="px-5 py-6">
          <p className="font-serif text-lg text-foreground">Xonorate</p>
          <p className="text-xs text-muted">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-foreground transition hover:bg-brand-light"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <p className="text-sm text-muted">Signed in as {session.user.email}</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="text-sm text-brand underline">
              Account settings
            </Link>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
