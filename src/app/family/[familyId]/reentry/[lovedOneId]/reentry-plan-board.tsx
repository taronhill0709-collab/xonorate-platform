"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  REENTRY_PLAN_CATEGORY_LABELS,
  REENTRY_PLAN_CATEGORY_STATUS_LABELS,
  REENTRY_PLAN_TIMEFRAMES,
  summarizeReentryPlanGaps,
  type ReentryPlanCategory,
  type ReentryPlanCategoryRow,
  type ReentryPlanCategoryStatus,
} from "@/family/reentry-plan-types";
import { generateCategoryDraftAction, generateInsightAction, saveCategoryAction } from "./actions";

type SupportPersonSummary = { name: string; canHelpWith: string[] };

type CategoryFields = {
  status: ReentryPlanCategoryStatus;
  plan30Day: string;
  plan60Day: string;
  plan90Day: string;
};

type RowState = "idle" | "saving" | "drafting" | "error";

function toFormState(categories: ReentryPlanCategoryRow[]): Record<ReentryPlanCategory, CategoryFields> {
  return Object.fromEntries(
    categories.map((c) => [
      c.category,
      { status: c.status, plan30Day: c.plan30Day ?? "", plan60Day: c.plan60Day ?? "", plan90Day: c.plan90Day ?? "" },
    ]),
  ) as Record<ReentryPlanCategory, CategoryFields>;
}

export function ReentryPlanBoard({
  familyId,
  lovedOneId,
  categories,
  supportPeople,
}: {
  familyId: string;
  lovedOneId: string;
  categories: ReentryPlanCategoryRow[];
  supportPeople: SupportPersonSummary[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => toFormState(categories));
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [insight, setInsight] = useState<{ summary: string; nextBestAction: string } | null>(null);
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "error">("idle");

  const gaps = summarizeReentryPlanGaps(
    categories.map((c) => ({ category: c.category, status: form[c.category]?.status ?? c.status })),
  );

  function updateField(category: ReentryPlanCategory, field: keyof CategoryFields, value: string) {
    setForm((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
  }

  async function handleSave(category: ReentryPlanCategory) {
    setRowState((s) => ({ ...s, [category]: "saving" }));
    const result = await saveCategoryAction(familyId, lovedOneId, category, form[category]);
    if (result.success) {
      setRowState((s) => ({ ...s, [category]: "idle" }));
      router.refresh();
    } else {
      setRowError((e) => ({ ...e, [category]: "Couldn't save — please try again." }));
      setRowState((s) => ({ ...s, [category]: "error" }));
    }
  }

  async function handleAiDraft(category: ReentryPlanCategory) {
    setRowState((s) => ({ ...s, [category]: "drafting" }));
    const result = await generateCategoryDraftAction(familyId, lovedOneId, category);
    if (result.success) {
      setForm((prev) => ({
        ...prev,
        [category]: { ...prev[category], plan30Day: result.plan30Day, plan60Day: result.plan60Day, plan90Day: result.plan90Day },
      }));
      setRowState((s) => ({ ...s, [category]: "idle" }));
    } else {
      setRowError((e) => ({ ...e, [category]: result.error }));
      setRowState((s) => ({ ...s, [category]: "error" }));
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
              {gaps.complete.length} complete · {gaps.incomplete.length} in progress · {gaps.notStarted.length} not started
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
              Generated with AI assistance from your plan&rsquo;s current status — not legal advice, and
              not a guarantee of any outcome.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {categories.map((c) => {
          const values = form[c.category];
          const state = rowState[c.category] ?? "idle";
          return (
            <section key={c.category} className="rounded-2xl border border-border bg-muted-background p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-base">{REENTRY_PLAN_CATEGORY_LABELS[c.category]}</h3>
                <select
                  value={values.status}
                  onChange={(e) => updateField(c.category, "status", e.target.value as ReentryPlanCategoryStatus)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                >
                  {Object.entries(REENTRY_PLAN_CATEGORY_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 space-y-3">
                {REENTRY_PLAN_TIMEFRAMES.map((tf) => (
                  <div key={tf.key}>
                    <label className="block text-xs font-medium text-muted">{tf.label}</label>
                    <textarea
                      rows={2}
                      value={values[tf.key]}
                      onChange={(e) => updateField(c.category, tf.key, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {state === "error" && rowError[c.category] && (
                <p className="mt-2 text-xs text-brand" role="alert">
                  {rowError[c.category]}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleSave(c.category)}
                  disabled={state === "saving"}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {state === "saving" ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => handleAiDraft(c.category)}
                  disabled={state === "drafting"}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs transition hover:border-brand hover:text-brand disabled:opacity-60"
                >
                  {state === "drafting" ? "Drafting…" : "AI: Help Organize"}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {supportPeople.length > 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-5">
          <h3 className="font-serif text-sm">Support network on file</h3>
          <p className="mt-1 text-xs text-muted">
            The AI tools above can reference these when suggesting a next step.
          </p>
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
