"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (status.kind === "done") {
    return (
      <p className="text-sm text-header-foreground">
        You&apos;re subscribed — thanks for staying in the loop.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus({ kind: "loading" });
    const result = await subscribeToNewsletter(formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setStatus({ kind: "done" });
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="Enter your email"
          className="w-full rounded-md border border-header-border bg-header-background px-3 py-2 text-sm text-header-foreground placeholder:text-header-muted focus:border-band-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="shrink-0 rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {status.kind === "error" && (
        <p className="mt-2 text-xs text-red-400">{status.message}</p>
      )}
    </div>
  );
}
