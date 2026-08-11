"use client";

import { useState } from "react";
import { submitFollowUp } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export function FollowUpForm({
  token,
  items,
}: {
  token: string;
  items: { key: string; label: string }[];
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (status.kind === "sent") {
    return (
      <p className="mt-8 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
        Thank you — we&apos;ve received what you shared and it&apos;s attached to your
        submission. Our team will follow up if we need anything else.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus({ kind: "loading" });
    const result = await submitFollowUp(token, formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setStatus({ kind: "sent" });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {items.map((item) => (
        <div key={item.key}>
          <label htmlFor={item.key} className="block text-sm font-medium text-foreground">
            {item.label}
          </label>
          <textarea
            id={item.key}
            name={item.key}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      ))}
      <div>
        <label htmlFor="other" className="block text-sm font-medium text-foreground">
          Anything else you&apos;d like to share
        </label>
        <textarea
          id="other"
          name="other"
          rows={4}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        Submit
      </button>
    </form>
  );
}
