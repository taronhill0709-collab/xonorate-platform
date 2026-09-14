"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_LABEL,
  RESOURCE_TYPE_LABEL,
  audienceLabel,
} from "@/lib/resource-taxonomy";

export type ResourceBrowserRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string | null;
  resourceType: string;
  audiences: unknown;
  state: string | null;
  description: string;
  url: string | null;
  featured: boolean;
};

/** Client-side browse/search/filter over the Resource Center — same
 * in-memory-filtering approach as CasesBrowser (cases-browser.tsx): the
 * resource count is small enough that a client component over one server
 * fetch is simpler and faster than a paginated API. Reads initial
 * category/query state from the URL so links from the hub page
 * (/resources) land pre-filtered. */
export function ResourcesBrowser({
  rows,
  initialCategory = "all",
  initialQuery = "",
}: {
  rows: ResourceBrowserRow[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [resourceType, setResourceType] = useState("all");
  const [audience, setAudience] = useState("all");
  const [state, setState] = useState("all");

  const parsed = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        audienceTags: (row.audiences as string[] | null) ?? [],
      })),
    [rows],
  );

  const categoriesPresent = useMemo(
    () => new Set(parsed.map((r) => r.category)),
    [parsed],
  );
  const resourceTypes = useMemo(
    () => Array.from(new Set(parsed.map((r) => r.resourceType))).sort(),
    [parsed],
  );
  const audiences = useMemo(
    () => Array.from(new Set(parsed.flatMap((r) => r.audienceTags))).sort(),
    [parsed],
  );
  const states = useMemo(
    () => Array.from(new Set(parsed.map((r) => r.state).filter((s): s is string => Boolean(s)))).sort(),
    [parsed],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parsed.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (resourceType !== "all" && row.resourceType !== resourceType) return false;
      if (audience !== "all" && !row.audienceTags.includes(audience)) return false;
      if (state !== "all" && row.state !== state) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        (row.subcategory ?? "").toLowerCase().includes(q) ||
        (row.state ?? "").toLowerCase().includes(q)
      );
    });
  }, [parsed, query, category, resourceType, audience, state]);

  const activeFilterCount = [resourceType, audience, state].filter((v) => v !== "all").length;

  return (
    <div>
      <div className="flex flex-col gap-5 border-t border-header-border pt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wrongful-conviction resources…"
          className="w-full border border-header-border bg-header-background px-4 py-2.5 text-sm text-header-foreground placeholder:text-header-muted focus:border-brand focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`border px-4 py-2 font-mono text-[11px] font-bold tracking-wide uppercase ${
              category === "all"
                ? "border-brand bg-brand-light text-foreground"
                : "border-header-border text-header-muted hover:text-header-foreground"
            }`}
          >
            All resources
          </button>
          {RESOURCE_CATEGORIES.filter((c) => categoriesPresent.has(c)).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`border px-4 py-2 font-mono text-[11px] font-bold tracking-wide uppercase ${
                category === c
                  ? "border-brand bg-brand-light text-foreground"
                  : "border-header-border text-header-muted hover:text-header-foreground"
              }`}
            >
              {RESOURCE_CATEGORY_LABEL[c]}
            </button>
          ))}

          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="border border-header-border bg-header-background px-3 py-2 font-mono text-[11px] font-bold tracking-wide text-header-muted uppercase focus:border-brand focus:outline-none"
          >
            <option value="all">Type: All</option>
            {resourceTypes.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>

          {audiences.length > 0 && (
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border border-header-border bg-header-background px-3 py-2 font-mono text-[11px] font-bold tracking-wide text-header-muted uppercase focus:border-brand focus:outline-none"
            >
              <option value="all">Audience: All</option>
              {audiences.map((a) => (
                <option key={a} value={a}>
                  {audienceLabel(a)}
                </option>
              ))}
            </select>
          )}

          {states.length > 0 && (
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
          )}

          {(query || category !== "all" || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setResourceType("all");
                setAudience("all");
                setState("all");
              }}
              className="font-mono text-[11px] font-bold tracking-wide text-brand uppercase hover:text-accent"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 font-mono text-xs tracking-wide text-header-muted uppercase">
        {filtered.length} of {rows.length} resource{rows.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 border border-dashed border-header-border p-8 text-center text-sm text-header-muted">
          No resources match those filters.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-px border border-header-border bg-header-border sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <Link
              key={row.id}
              href={`/resources/${row.slug}`}
              className="group flex flex-col bg-header-background p-6 transition hover:bg-[#0a0a09]"
            >
              <span className="inline-flex w-fit items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-wide text-brand uppercase">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {RESOURCE_CATEGORY_LABEL[row.category] ?? row.category}
              </span>
              <p className="mt-2.5 font-serif text-2xl text-header-foreground">{row.title}</p>
              {row.subcategory && (
                <p className="mt-0.5 font-mono text-[10px] font-bold tracking-wide text-header-muted uppercase">
                  {row.subcategory}
                </p>
              )}
              <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-header-muted">{row.description}</p>
              <span className="mt-auto pt-5 font-mono text-[11px] font-bold tracking-wide text-header-foreground uppercase transition group-hover:text-brand">
                {row.url ? "Explore →" : "Read guide →"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
