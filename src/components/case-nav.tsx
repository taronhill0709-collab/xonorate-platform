"use client";

import { useEffect, useState } from "react";

export type CaseNavItem = { href: string; label: string };

/** Sticky in-page navigation for a case's sections — only ever rendered
 * with the sections that actually exist for that case (see the filtering
 * in the case page itself), and highlights whichever section is currently
 * in view via IntersectionObserver rather than staying pinned to the
 * first item. */
export function CaseNav({ items }: { items: CaseNavItem[] }) {
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    // Recompute from every section's live position rather than trusting
    // which IntersectionObserver entries happened to change this callback
    // (that list can skip a section whose state didn't just flip, which
    // silently freezes the highlighted item on a long page like this one).
    const pickActive = () => {
      const threshold = 120; // roughly the nav's own height
      let current = sections[0];
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= threshold) current = el;
      }
      setActiveHref(`#${current.id}`);
    };

    const observer = new IntersectionObserver(pickActive, { threshold: [0, 1] });
    sections.forEach((el) => observer.observe(el));
    pickActive();
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-0 z-20 overflow-x-auto border-b border-header-border bg-header-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl gap-1 px-6">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`inline-block shrink-0 border-b-2 px-3.5 py-3.5 font-mono text-[11px] font-semibold tracking-wide uppercase transition ${
              activeHref === item.href
                ? "border-brand text-header-foreground"
                : "border-transparent text-header-muted hover:text-header-foreground"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
