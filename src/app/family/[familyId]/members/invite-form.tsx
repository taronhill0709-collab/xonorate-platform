"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMemberAction } from "./actions";

export function InviteForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "sent" }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", role);
    const result = await inviteMemberAction(familyId, formData);
    if (result.success) {
      setStatus({ kind: "sent" });
      setEmail("");
      router.refresh();
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="invite-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium">
          Permission
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "owner" | "member")}
          className="mt-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          <option value="member">Family Member</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {status.kind === "loading" ? "Sending…" : "Send Invitation"}
      </button>
      {status.kind === "error" && (
        <p className="w-full text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}
      {status.kind === "sent" && (
        <p className="w-full text-sm text-accent">Invitation sent.</p>
      )}
    </form>
  );
}
