"use client";

import { useState } from "react";
import { submitGeneralInquiry } from "./actions";

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
        Thanks for reaching out — our team will get back to you by email.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStatus({ kind: "loading" });
    const result = await submitGeneralInquiry(formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setStatus({ kind: "sent" });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Your email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground">
          Your message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="What would you like to ask us?"
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
