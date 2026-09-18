"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSupportPersonAction, updateSupportPersonAction } from "./actions";

const SUGGESTED_TAGS = [
  "Housing",
  "Employment",
  "Transportation",
  "Family support",
  "Community support",
  "Financial support",
  "Childcare",
];

export function EditSupportPersonForm({
  familyId,
  personId,
  name,
  relationship,
  email,
  phone,
  role,
  canHelpWith,
  notes,
  lovedOneId,
  lovedOnes,
}: {
  familyId: string;
  personId: string;
  name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  canHelpWith: string[];
  notes: string | null;
  lovedOneId: string | null;
  lovedOnes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    canHelpWith.filter((t) => SUGGESTED_TAGS.includes(t)),
  );
  const [customTags, setCustomTags] = useState(
    canHelpWith.filter((t) => !SUGGESTED_TAGS.includes(t)).join(", "),
  );
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

    const custom = customTags.split(",").map((t) => t.trim()).filter(Boolean);
    formData.set("canHelpWith", [...selectedTags, ...custom].join(","));

    const result = await updateSupportPersonAction(familyId, personId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/support`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${name} from your support network?`)) return;
    await deleteSupportPersonAction(familyId, personId);
    router.push(`/family/${familyId}/support`);
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
          defaultValue={name}
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
            defaultValue={relationship ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <input
            id="role"
            name="role"
            defaultValue={role ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium">Can help with</p>
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
            defaultValue={lovedOneId ?? ""}
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
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={notes ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === "loading" ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-muted transition hover:text-brand"
        >
          Remove Person
        </button>
      </div>
    </form>
  );
}
