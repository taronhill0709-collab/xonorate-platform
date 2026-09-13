"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      // Every /admin/* route is force-dynamic (fresh DB queries on every
      // render, never cached) — Link's default prefetch-on-viewport would
      // otherwise fire a full server render for all ~15 sidebar items on
      // every admin page load. Confirmed live: that burst of concurrent
      // DB-backed requests intermittently exhausts the database connection
      // limit, causing real form submissions (e.g. saving an investigation)
      // to occasionally fail with a 503 for no visible reason.
      prefetch={false}
      className={
        isActive
          ? "rounded-md bg-white/10 px-2 py-1.5 text-sm font-medium text-brand"
          : "rounded-md px-2 py-1.5 text-sm text-header-muted transition hover:bg-white/10 hover:text-header-foreground"
      }
    >
      {label}
    </Link>
  );
}
