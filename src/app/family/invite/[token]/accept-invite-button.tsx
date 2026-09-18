"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "./actions";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleClick() {
    setStatus({ kind: "loading" });
    const result = await acceptInviteAction(token);
    if (result.success) {
      router.push("/family");
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={status.kind === "loading"}
        className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {status.kind === "loading" ? "Joining…" : "Accept Invitation"}
      </button>
      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
}
