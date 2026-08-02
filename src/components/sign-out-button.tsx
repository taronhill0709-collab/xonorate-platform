"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`text-sm transition ${className ?? "text-muted hover:text-foreground"}`}
    >
      Sign out
    </button>
  );
}
