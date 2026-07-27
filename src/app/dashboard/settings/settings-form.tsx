"use client";

import { useState } from "react";
import { updatePassword } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function SettingsForm({ hasPassword }: { hasPassword: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus({ kind: "loading" });
    const result = await updatePassword(formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    form.reset();
    setStatus({ kind: "success" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-serif text-lg text-foreground">
        {hasPassword ? "Change password" : "Set a password"}
      </h2>
      {!hasPassword && (
        <p className="text-sm text-muted">
          Your account currently only signs in via email link. Set a password to also enable
          password sign-in.
        </p>
      )}

      {hasPassword && (
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>

      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}
      {status.kind === "success" && <p className="text-sm text-muted">Password updated.</p>}

      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {hasPassword ? "Update password" : "Set password"}
      </button>
    </form>
  );
}
