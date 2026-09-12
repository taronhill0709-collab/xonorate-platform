"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  contributingFactorTags: unknown;
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
        tags: (row.contributingFactorTags as string[] | null) ?? [],
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

  const activeFilterCount = [state, charge].filter((v) => v !== "all").length;

  return (
    <div>
      <div className="flex flex-col gap-5 border-t border-header-border pt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, state, or charge…"
          className="w-full border border-header-border bg-header-background px-4 py-2.5 text-sm text-header-foreground placeholder:text-header-muted focus:border-brand focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStatus("all")}
            className={`border px-4 py-2 font-mono text-[11px] font-bold tracking-wide uppercase ${
              status === "all"
                ? "border-brand bg-brand-light text-foreground"
                : "border-header-border text-header-muted hover:text-header-foreground"
            }`}
          >
            All cases
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`border px-4 py-2 font-mono text-[11px] font-bold tracking-wide uppercase ${
                status === s
                  ? "border-brand bg-brand-light text-foreground"
                  : "border-header-border text-header-muted hover:text-header-foreground"
              }`}
            >
              {CASE_STATUS_LABEL[s]}
            </button>
          ))}

          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="border border-header-border bg-header-background px-3 py-2 font-mono text-[11px] font-bold tracking-wide text-header-muted uppercase focus:border-brand focus:outline-none"
          >
            <option value="all">State: All</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
            className="border border-header-border bg-header-background px-3 py-2 font-mono text-[11px] font-bold tracking-wide text-header-muted uppercase focus:border-brand focus:outline-none"
          >
            <option value="all">Conviction: All</option>
            {charges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(query || status !== "all" || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setState("all");
                setStatus("all");
                setCharge("all");
              }}
              className="font-mono text-[11px] font-bold tracking-wide text-brand uppercase hover:text-accent"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 font-mono text-xs tracking-wide text-header-muted uppercase">
        {filtered.length} of {rows.length} case{rows.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 border border-dashed border-header-border p-8 text-center text-sm text-header-muted">
          No cases match those filters.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-px border border-header-border bg-header-border sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const yearsHeadline = row.timeServed?.split("(")[0].trim();
            const yearsLabel = row.status === "exonerated" ? "Years lost" : "Served so far";
            const intelText =
              row.tags.length > 0
                ? row.tags.join(", ")
                : row.summary;
            const exonerated = row.status === "exonerated";

            return (
              <Link
                key={row.id}
                href={`/cases/${row.slug}`}
                className="group flex flex-col bg-header-background p-6 transition hover:bg-[#0a0a09]"
              >
                <span
                  className={`inline-flex w-fit items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-wide uppercase ${
                    exonerated ? "text-header-label" : "text-brand"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      exonerated ? "bg-header-label" : "bg-brand"
                    }`}
                    aria-hidden
                  />
                  {CASE_STATUS_LABEL[row.status] ?? row.status}
                </span>
                <p className="mt-2.5 font-serif text-3xl text-header-foreground">{row.clientName}</p>
                {!row.isClient && (
                  <p className="mt-0.5 font-mono text-[10px] font-bold tracking-wide text-header-muted uppercase">
                    {SPOTLIGHT_CASE_LABEL}
                  </p>
                )}

                {yearsHeadline && (
                  <div className="mt-3.5 flex items-baseline gap-2">
                    <span className="font-serif text-3xl text-brand tabular-nums">{yearsHeadline}</span>
                    <span className="font-mono text-[10px] tracking-wide text-header-muted uppercase">
                      {yearsLabel}
                    </span>
                  </div>
                )}
                <p className="mt-2.5 font-mono text-[11px] tracking-wide text-header-muted uppercase">
                  {row.state}
                  {row.county ? `, ${row.county} County` : ""} · {row.charge}
                </p>

                <div className="mt-4 border-t border-header-border pt-4">
                  <p className="font-mono text-[9.5px] tracking-widest text-header-label uppercase">
                    Case intelligence
                  </p>
                  <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-header-muted">
                    {intelText}
                  </p>
                </div>

                <span className="mt-auto pt-5 font-mono text-[11px] font-bold tracking-wide text-header-foreground uppercase transition group-hover:text-brand">
                  View case intelligence →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
