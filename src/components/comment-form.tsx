"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitComment } from "@/app/comments/actions";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "posted"; published: boolean }
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
    setStatus({ kind: "posted", published: result.published });
    if (result.published) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Share your thoughts…"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}
      {status.kind === "posted" && (
        <p className="text-sm text-muted">
          {status.published
            ? "Posted."
            : "Thanks — your first few comments are reviewed before they appear publicly."}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        Post comment
      </button>
    </form>
  );
}
