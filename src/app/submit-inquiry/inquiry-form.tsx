"use client";

import { useState } from "react";
import { submitInquiry } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export function InquiryForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (status.kind === "sent") {
    return (
      <p className="rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
        Thank you — our team reviews every submission and will follow up if we need more
        information. This is never published without your knowledge.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus({ kind: "loading" });
    const result = await submitInquiry(formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setStatus({ kind: "sent" });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="submitterName" className="block text-sm font-medium text-foreground">
          Your name
        </label>
        <input
          id="submitterName"
          name="submitterName"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="submitterEmail" className="block text-sm font-medium text-foreground">
          Your email
        </label>
        <input
          id="submitterEmail"
          name="submitterEmail"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label
          htmlFor="relationshipToPerson"
          className="block text-sm font-medium text-foreground"
        >
          Your relationship to them
        </label>
        <input
          id="relationshipToPerson"
          name="relationshipToPerson"
          required
          placeholder="e.g. mother, spouse, friend"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="personName" className="block text-sm font-medium text-foreground">
          Their name
        </label>
        <input
          id="personName"
          name="personName"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-foreground">
          State of conviction
        </label>
        <input
          id="state"
          name="state"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="caseSummary" className="block text-sm font-medium text-foreground">
          What happened
        </label>
        <textarea
          id="caseSummary"
          name="caseSummary"
          rows={6}
          required
          placeholder="Tell us what happened, when, and why you believe this was a wrongful conviction."
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
