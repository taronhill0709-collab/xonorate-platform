"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
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
