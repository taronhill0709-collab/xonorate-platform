"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitComment } from "@/app/comments/actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "posted" }
  | { kind: "error"; message: string };

export function CommentForm({
  targetType,
  targetId,
}: {
  targetType: "case" | "petition" | "post";
  targetId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus({ kind: "loading" });
    const result = await submitComment(targetType, targetId, formData);
    if (!result.success) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    form.reset();
    setStatus({ kind: "posted" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Share your thoughts…"
        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {status.kind === "error" && <p className="text-sm text-brand">{status.message}</p>}
      {status.kind === "posted" && <p className="text-sm text-muted">Posted.</p>}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent disabled:opacity-60"
      >
        Post comment
      </button>
    </form>
  );
}
