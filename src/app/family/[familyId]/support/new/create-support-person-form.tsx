"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupportPersonAction } from "./actions";

// Suggestions only — canHelpWith is a free-text tag array (see
// support-people.ts), not a closed vocabulary, so families aren't limited
// to this list. These mirror the categories Phase 2's reentry planner is
// expected to read (spec section 12/14).
const SUGGESTED_TAGS = [
  "Housing",
  "Employment",
  "Transportation",
  "Family support",
  "Community support",
  "Financial support",
  "Childcare",
];

export function CreateSupportPersonForm({
  familyId,
  lovedOnes,
  defaultLovedOneId,
}: {
  familyId: string;
  lovedOnes: { id: string; name: string }[];
  defaultLovedOneId?: string;
}) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);

    const custom = customTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    formData.set("canHelpWith", [...selectedTags, ...custom].join(","));

    const result = await createSupportPersonAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/support`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium">
            Relationship
          </label>
          <input
            id="relationship"
            name="relationship"
            placeholder="e.g. Sister, Pastor"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            Role <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="role"
            name="role"
            placeholder="e.g. Employer, Attorney"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium">
          Can help with <span className="font-normal text-muted">(optional)</span>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "border-brand bg-brand-light text-brand"
                    : "border-border bg-background text-muted hover:border-brand hover:text-brand"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <input
          value={customTags}
          onChange={(e) => setCustomTags(e.target.value)}
          placeholder="Something else? Add it here, comma-separated"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {lovedOnes.length > 0 && (
        <div>
          <label htmlFor="lovedOneId" className="block text-sm font-medium">
            About <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="lovedOneId"
            name="lovedOneId"
            defaultValue={defaultLovedOneId ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Not specific to one loved one</option>
            {lovedOnes.map((lo) => (
              <option key={lo.id} value={lo.id}>
                {lo.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {status.kind === "loading" ? "Saving…" : "Add Person"}
      </button>
    </form>
  );
}
