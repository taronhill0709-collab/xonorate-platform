"use client";

import { useState, useTransition } from "react";
import { postToInstagramAndFacebook } from "./actions";

export function PostToSocialButton({
  postId,
  alreadyPostedAt,
  disabledReason,
}: {
  postId: string;
  alreadyPostedAt: string | null;
  disabledReason?: string;
}) {
  const [postedAt, setPostedAt] = useState(alreadyPostedAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (postedAt) {
    return (
      <span className="text-sm text-muted">
        Posted to Instagram &amp; Facebook{" "}
        {new Date(postedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }

  if (disabledReason) {
    return <span className="text-sm text-muted">{disabledReason}</span>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await postToInstagramAndFacebook(postId);
            if (result.ok) {
              setPostedAt(new Date().toISOString());
            } else {
              setError(result.error);
            }
          });
        }}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Posting…" : "Post to Instagram & Facebook"}
      </button>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
