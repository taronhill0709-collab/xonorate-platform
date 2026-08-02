"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center text-header-foreground"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-header-border bg-header-background px-6 py-4 shadow-sm">
          <nav
            className="flex flex-col gap-4 text-sm"
            onClick={() => setOpen(false)}
          >
            {children}
          </nav>
        </div>
      )}
    </div>
  );
}
