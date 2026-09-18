"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLovedOneAction } from "./actions";

export function CreateLovedOneForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await createLovedOneAction(familyId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${result.lovedOneId}`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="lo-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="lo-name"
          name="name"
          required
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="lo-preferred" className="block text-sm font-medium">
          Preferred name{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="lo-preferred"
          name="preferredName"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lo-facility" className="block text-sm font-medium">
            Facility <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="lo-facility"
            name="facilityName"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="lo-state" className="block text-sm font-medium">
            State
          </label>
          <input
            id="lo-state"
            name="facilityState"
            placeholder="NY"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="lo-inmate" className="block text-sm font-medium">
          Inmate ID <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="lo-inmate"
          name="inmateId"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <p className="text-xs text-muted">
        Don&rsquo;t know everything yet? That&rsquo;s okay — you can add
        dates, documents, and more details anytime.
      </p>

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
        {status.kind === "loading" ? "Saving…" : "Add Your Loved One"}
      </button>
    </form>
  );
}
