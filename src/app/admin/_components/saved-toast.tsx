"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  "1": "Saved",
  deleted: "Deleted",
  posted: "Posted",
};

/** Mounted once in the admin layout. Any admin action that redirects back
 * to a page with ?saved=<key> gets a toast here — no per-page banner
 * markup needed. The query param is only stripped once the toast is about
 * to dismiss (not immediately on mount) — calling router.replace right
 * away appears to remount this component as part of the App Router
 * re-rendering the segment for the new URL, wiping the just-set message
 * state before it ever paints. */
export function SavedToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Derive the toast message from the URL during render (React's sanctioned
  // pattern for "adjust state when a prop changes") rather than in an
  // effect, since the message must outlive the query param once it's
  // stripped below. Only reacts to `saved` appearing/changing — not to it
  // reverting to null, which happens when we clean it up on dismiss.
  if (saved && saved !== lastSaved) {
    setLastSaved(saved);
    setMessage(MESSAGES[saved] ?? "Saved");
  }

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => {
      setMessage(null);
      const params = new URLSearchParams(searchParams);
      params.delete("saved");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only restart the timer when the message itself changes, not on every searchParams/router identity change
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-header-border bg-header-background px-4 py-2.5 text-sm font-medium text-header-foreground shadow-lg"
    >
      <span className="mr-2 text-band-accent">✓</span>
      {message}
    </div>
  );
}
