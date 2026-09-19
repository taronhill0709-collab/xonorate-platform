"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Timeline lives at .../loved-ones/[lovedOneId]/timeline, a sibling of
// .../case, not nested under it — it's a general loved-one feature (see
// timeline.ts's header comment), not Case-Organizer-only. It still gets
// a tab here so the workspace feels like one cohesive place, per the
// spec's persistent-tab-structure requirement.
const TABS = [
  { key: "overview", label: "Overview", suffix: "/case" },
  { key: "timeline", label: "Timeline", suffix: "/timeline" },
  { key: "documents", label: "Documents", suffix: "/case/documents" },
  { key: "people", label: "People", suffix: "/case/people" },
  { key: "notes-issues", label: "Notes & Issues", suffix: "/case/notes-issues" },
  { key: "dates", label: "Important Dates", suffix: "/case/dates" },
];

export function CaseTabs({ familyId, lovedOneId }: { familyId: string; lovedOneId: string }) {
  const pathname = usePathname();
  const base = `/family/${familyId}/loved-ones/${lovedOneId}`;
  const hrefs = TABS.map((tab) => ({ ...tab, href: `${base}${tab.suffix}` }));

  // Longest-matching href wins — Overview's href ("…/case") is a prefix
  // of every other tab's, so a naive startsWith check would light up
  // Overview on every tab. Sorting by href length and taking the first
  // match picks the most specific tab instead.
  const activeHref = [...hrefs]
    .sort((a, b) => b.href.length - a.href.length)
    .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.href;

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
      {hrefs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition ${
            tab.href === activeHref
              ? "border-b-2 border-brand text-brand"
              : "border-b-2 border-transparent text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
