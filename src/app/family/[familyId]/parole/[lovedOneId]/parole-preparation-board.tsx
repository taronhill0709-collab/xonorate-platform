"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PAROLE_SECTIONS,
  PAROLE_SECTION_STATUS_LABELS,
  summarizeParolePreparationGaps,
  type ParoleFreeformSection,
  type ParoleSectionKey,
  type ParoleSectionRow,
  type ParoleSectionStatus,
} from "@/family/parole-preparation-types";
import { generateInsightAction, saveSectionAction } from "./actions";

type SupportPersonSummary = { name: string; canHelpWith: string[] };
type RowState = "idle" | "saving" | "error";

// Where a derived (read-only) section's status actually comes from, and
// the existing page that moves it forward — this board never lets you
// edit these directly, since they're computed from other Family features.
const DERIVED_INFO: Partial<Record<ParoleSectionKey, { href: (familyId: string, lovedOneId: string) => string; hint: string; linkLabel: string }>> = {
  support_network: {
    href: (familyId) => `/family/${familyId}/support`,
    hint: "Reflects who's listed in your Support Network and what they said they can help with.",
    linkLabel: "Go to Support Network",
  },
  first_90_days: {
    href: (familyId, lovedOneId) => `/family/${familyId}/reentry/${lovedOneId}`,
    hint: "Reflects this loved one's Reentry Plan — its 30/60/90-day content across every category.",
    linkLabel: "Go to Reentry Planner",
  },
  support_letters: {
    href: (familyId) => `/family/${familyId}/letters`,
    hint: "Reflects any parole support letters written or requested for this loved one.",
    linkLabel: "Go to Letters",
  },
  documents: {
    href: (familyId) => `/family/${familyId}/documents`,
    hint: "Reflects any documents tagged “Parole” for this loved one.",
    linkLabel: "Go to Documents",
  },
};

function statusBadgeClass(status: ParoleSectionStatus): string {
  if (status === "complete") return "bg-accent/15 text-accent";
  if (status === "incomplete") return "bg-brand-light text-brand";
  return "bg-muted-background text-muted";
}

type FreeformFields = { status: ParoleSectionStatus; notes: string };

export function ParolePreparationBoard({
  familyId,
  lovedOneId,
  sections,
  freeformNotes,
  supportPeople,
}: {
  familyId: string;
  lovedOneId: string;
  sections: ParoleSectionRow[];
  freeformNotes: Record<ParoleFreeformSection, string | null>;
  supportPeople: SupportPersonSummary[];
}) {
  const router = useRouter();
  const statusByKey = new Map(sections.map((s) => [s.key, s.status]));
  const [form, setForm] = useState<Record<ParoleFreeformSection, FreeformFields>>(() => {
    const entries = PAROLE_SECTIONS.filter((s) => s.kind === "freeform").map((s) => {
      const key = s.key as ParoleFreeformSection;
      return [key, { status: statusByKey.get(key) ?? "not_started", notes: freeformNotes[key] ?? "" }] as const;
    });
    return Object.fromEntries(entries) as Record<ParoleFreeformSection, FreeformFields>;
  });
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [insight, setInsight] = useState<{ summary: string; nextBestAction: string } | null>(null);
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "error">("idle");

  const gaps = summarizeParolePreparationGaps(
    PAROLE_SECTIONS.map((s) =>
      s.kind === "freeform"
        ? { key: s.key, status: form[s.key as ParoleFreeformSection].status }
        : { key: s.key, status: statusByKey.get(s.key) ?? "not_started" },
    ),
  );

  function updateField(section: ParoleFreeformSection, field: keyof FreeformFields, value: string) {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }

  async function handleSave(section: ParoleFreeformSection) {
    setRowState((s) => ({ ...s, [section]: "saving" }));
    const result = await saveSectionAction(familyId, lovedOneId, section, form[section]);
    if (result.success) {
      setRowState((s) => ({ ...s, [section]: "idle" }));
      router.refresh();
    } else {
      setRowState((s) => ({ ...s, [section]: "error" }));
    }
  }

  async function handleInsight() {
    setInsightStatus("loading");
    const result = await generateInsightAction(familyId, lovedOneId);
    if (result.success) {
      setInsight({ summary: result.summary, nextBestAction: result.nextBestAction });
      setInsightStatus("idle");
    } else {
      setInsightStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg">Where things stand</h2>
            <p className="mt-1 text-sm text-muted">
              {gaps.complete.length} complete &middot; {gaps.incomplete.length} in progress &middot; {gaps.notStarted.length} not started
            </p>
          </div>
          <button
            onClick={handleInsight}
            disabled={insightStatus === "loading"}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {insightStatus === "loading" ? "Thinking…" : "Get AI Insight"}
          </button>
        </div>
        {insightStatus === "error" && (
          <p className="mt-3 text-sm text-brand" role="alert">
            Couldn&rsquo;t generate an insight right now — please try again.
          </p>
        )}
        {insight && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-sm">{insight.summary}</p>
            <p className="mt-2 text-sm font-semibold">Next best action: {insight.nextBestAction}</p>
            <p className="mt-2 text-xs text-muted">
              Generated with AI assistance from your preparation&rsquo;s current status &mdash; not legal
              advice, and never a prediction of what the parole board will decide.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {PAROLE_SECTIONS.map((s) => {
          if (s.kind === "derived") {
            const info = DERIVED_INFO[s.key];
            const status = statusByKey.get(s.key) ?? "not_started";
            return (
              <section key={s.key} className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-base">{s.label}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
                    {PAROLE_SECTION_STATUS_LABELS[status]}
                  </span>
                </div>
                {info && (
                  <>
                    <p className="mt-2 text-xs text-muted">{info.hint}</p>
                    <Link href={info.href(familyId, lovedOneId)} className="mt-3 inline-block text-xs font-semibold text-brand">
                      {info.linkLabel} →
                    </Link>
                  </>
                )}
              </section>
            );
          }

          const section = s.key as ParoleFreeformSection;
          const values = form[section];
          const state = rowState[section] ?? "idle";
          return (
            <section key={section} className="rounded-2xl border border-border bg-muted-background p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-base">{s.label}</h3>
                <select
                  value={values.status}
                  onChange={(e) => updateField(section, "status", e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                >
                  {Object.entries(PAROLE_SECTION_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={3}
                value={values.notes}
                onChange={(e) => updateField(section, "notes", e.target.value)}
                placeholder="Notes on where this stands…"
                className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              {state === "error" && (
                <p className="mt-2 text-xs text-brand" role="alert">
                  Couldn&rsquo;t save — please try again.
                </p>
              )}
              <button
                onClick={() => handleSave(section)}
                disabled={state === "saving"}
                className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {state === "saving" ? "Saving…" : "Save"}
              </button>
            </section>
          );
        })}
      </div>

      {supportPeople.length > 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
          <h3 className="font-serif text-sm">Support network on file</h3>
          <p className="mt-1 text-xs text-muted">The AI Insight above can reference these when suggesting a next step.</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {supportPeople.map((p) => (
              <li key={p.name}>
                {p.name}
                {p.canHelpWith.length ? ` — can help with ${p.canHelpWith.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
