"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFamily } from "./actions";

export function CreateFamilyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const result = await createFamily(name);
    if (result.success) {
      router.push(`/family/${result.familyId}/loved-ones/new?welcome=1`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 text-left">
      <div>
        <label htmlFor="family-name" className="block text-sm font-medium">
          Family name
        </label>
        <input
          id="family-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Johnson Family"
          required
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
        {status.kind === "loading" ? "Creating…" : "Create Your Family"}
      </button>
    </form>
  );
}
