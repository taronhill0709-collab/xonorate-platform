"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RedactedPhoto } from "@/components/redacted-photo";
import { CASE_STATUS_LABEL, SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";

type ConvictionDetails = { charge: string; year: number };

export type CaseBrowserRow = {
  id: string;
  clientName: string;
  slug: string;
  summary: string;
  status: string;
  state: string;
  county: string | null;
  photoUrl: string | null;
  isClient: boolean;
  timeServed: string | null;
  convictionDetails: unknown;
};

const STATUS_OPTIONS = ["active_case", "awaiting_review", "exonerated"] as const;

/** Client-side browse/search/filter over the case archive — the case count
 * is small enough today that filtering in-memory is the right call (no new
 * API route needed), but this is real interactive functionality, not a
 * decoration: search by name/state/charge, filter by state, status, and
 * conviction type, all at once. */
export function CasesBrowser({ rows }: { rows: CaseBrowserRow[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");
  const [charge, setCharge] = useState("all");

  const parsed = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        charge: (row.convictionDetails as ConvictionDetails).charge,
        year: (row.convictionDetails as ConvictionDetails).year,
      })),
    [rows],
  );

  const states = useMemo(
    () => Array.from(new Set(parsed.map((r) => r.state))).sort(),
    [parsed],
  );
  const charges = useMemo(
    () => Array.from(new Set(parsed.map((r) => r.charge))).sort(),
    [parsed],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parsed.filter((row) => {
      if (state !== "all" && row.state !== state) return false;
      if (status !== "all" && row.status !== status) return false;
      if (charge !== "all" && row.charge !== charge) return false;
      if (!q) return true;
      return (
        row.clientName.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q) ||
        (row.county ?? "").toLowerCase().includes(q) ||
        row.charge.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q)
      );
    });
  }, [parsed, query, state, status, charge]);

  const activeFilterCount = [state, status, charge].filter((v) => v !== "all").length;

  return (
    <div>
      <div className="flex flex-col gap-4 border border-header-border bg-muted-background p-5">
        <label className="block">
          <span className="sr-only">Search cases</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, state, or charge…"
            className="w-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-label uppercase">
            State
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm font-normal text-foreground normal-case focus:border-brand focus:outline-none"
            >
              <option value="all">All</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-label uppercase">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm font-normal text-foreground normal-case focus:border-brand focus:outline-none"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {CASE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold tracking-wide text-label uppercase">
            Conviction
            <select
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
              className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm font-normal text-foreground normal-case focus:border-brand focus:outline-none"
            >
              <option value="all">All</option>
              {charges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(query || activeFilterCount > 0) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setState("all");
              setStatus("all");
              setCharge("all");
            }}
            className="self-start text-xs font-bold tracking-wide text-brand uppercase hover:text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="mt-4 font-mono text-xs tracking-wide text-muted uppercase">
        {filtered.length} of {rows.length} case{rows.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-8 text-center text-sm text-muted">
          No cases match those filters.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row, i) => (
            <Link
              key={row.id}
              href={`/cases/${row.slug}`}
              className="group flex flex-col border border-header-border"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden">
                {row.photoUrl ? (
                  <Image
                    src={row.photoUrl}
                    alt={row.clientName}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <RedactedPhoto seed={i} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-brand uppercase">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {CASE_STATUS_LABEL[row.status] ?? row.status}
                  </span>
                  <p className="mt-1.5 font-serif text-xl text-white">{row.clientName}</p>
                  {!row.isClient && (
                    <p className="mt-0.5 text-[11px] font-bold tracking-wide text-white/60 uppercase">
                      {SPOTLIGHT_CASE_LABEL}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 bg-muted-background px-4 py-3">
                <p className="font-mono text-xs font-bold tracking-wide text-label uppercase">
                  {row.state}
                  {row.county ? `, ${row.county} County` : ""} · {row.charge}
                </p>
                <p className="line-clamp-2 flex-1 text-sm text-muted">{row.summary}</p>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                  {row.timeServed ? (
                    <span className="truncate font-semibold text-brand">
                      {row.timeServed.split("(")[0].trim()} served
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="shrink-0 font-bold text-brand uppercase">View case →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
