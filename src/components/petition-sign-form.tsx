"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signPetition } from "@/app/petitions/actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent"; email: string }
  | { kind: "signed" }
  | { kind: "error"; message: string };

export function PetitionSignForm({
  petitionId,
  alreadyConfirmed,
  initiallySigned = false,
}: {
  petitionId: string;
  alreadyConfirmed: boolean;
  initiallySigned?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(
    initiallySigned ? { kind: "signed" } : { kind: "idle" },
  );

  if (alreadyConfirmed || status.kind === "signed") {
    return (
      <p className="rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
        Thanks for signing — your signature has been confirmed and counted.
      </p>
    );
  }

  if (status.kind === "sent") {
    return (
      <p className="rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
        Check {status.email} for a confirmation link. Your signature counts once confirmed.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = session?.user?.email ?? String(formData.get("email") ?? "");

    setStatus({ kind: "loading" });
    const result = await signPetition(petitionId, formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    if (result.alreadyVerified) {
      setStatus({ kind: "signed" });
      router.refresh();
    } else {
      setStatus({ kind: "sent", email });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          defaultValue={session?.user?.name ?? ""}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      {!session?.user && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <p className="mt-1 text-xs text-muted">
            We&apos;ll send a one-time confirmation link — it&apos;s never shown publicly.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-foreground">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        Sign the petition
      </button>
    </form>
  );
}
