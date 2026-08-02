"use client";

import { useTransition } from "react";
import { movePost } from "./actions";

export function PostReorderButtons({
  postId,
  isFirst,
  isLast,
}: {
  postId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="Move up"
        disabled={isPending || isFirst}
        onClick={() => startTransition(() => movePost(postId, "up"))}
        className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={isPending || isLast}
        onClick={() => startTransition(() => movePost(postId, "down"))}
        className="leading-none text-muted transition hover:text-foreground disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
