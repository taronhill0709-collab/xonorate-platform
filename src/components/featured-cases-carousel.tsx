"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";

export type FeaturedCase = {
  id: string;
  slug: string;
  clientName: string;
  state: string;
  status: string;
  photoUrl: string | null;
  convictedYear: number;
  timeServed: string | null;
  isClient: boolean;
};

/** Horizontally scrolling strip of case cards with prev/next arrows and dot
 * indicators. The dots track scroll position by card width rather than a
 * fixed "page" concept, so it stays correct at any viewport width. */
export function FeaturedCasesCarousel({ cases }: { cases: FeaturedCase[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const amount = (card?.offsetWidth ?? 260) + 16;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const width = (card?.offsetWidth ?? 260) + 16;
    setActive(Math.round(track.scrollLeft / width));
  }

  if (cases.length === 0) {
    return (
      <p className="text-sm text-header-muted">No cases published yet.</p>
    );
  }

  return (
    <div className="relative">
      {cases.length > 1 && (
        <button
          type="button"
          aria-label="Previous case"
          onClick={() => scrollByCard(-1)}
          className="absolute top-1/3 -left-4 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-header-border bg-header-background text-header-foreground shadow-lg transition hover:text-band-accent sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/cases/${c.slug}`}
            className="group w-56 shrink-0 snap-start overflow-hidden rounded-lg border border-header-border bg-white/[0.03] transition hover:border-header-muted sm:w-60"
          >
            <div className="relative h-40 w-full bg-header-border/40">
              {c.photoUrl ? (
                <Image
                  src={c.photoUrl}
                  alt={c.clientName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-header-muted">
                  <span className="font-serif text-3xl">
                    {c.clientName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="absolute top-2 left-2 rounded-full bg-header-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-header-foreground uppercase">
                {CASE_STATUS_LABEL[c.status] ?? c.status}
              </span>
            </div>
            <div className="p-4">
              <p className="font-serif text-lg text-header-foreground">
                {c.clientName}
              </p>
              <p className="mt-1 text-xs text-header-muted">{c.state}</p>
              <p className="mt-2 text-xs text-header-muted">
                Convicted: {c.convictedYear}
                {c.timeServed ? ` · Served: ${c.timeServed}` : ""}
              </p>
              {!c.isClient && (
                <p className="mt-2 inline-flex items-center rounded-full border border-header-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-header-muted uppercase">
                  {SPOTLIGHT_CASE_LABEL}
                </p>
              )}
              <span className="mt-3 inline-block text-xs text-band-accent underline">
                View case →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {cases.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Next case"
            onClick={() => scrollByCard(1)}
            className="absolute top-1/3 -right-4 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-header-border bg-header-background text-header-foreground shadow-lg transition hover:text-band-accent sm:flex"
          >
            <ChevronRight size={18} />
          </button>
          <div className="mt-4 flex justify-center gap-1.5">
            {cases.map((c, i) => (
              <span
                key={c.id}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === active ? "bg-band-accent" : "bg-header-border"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
