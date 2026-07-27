"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        onClick={handleCopy}
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Share on X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Share on Facebook
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Email
      </a>
    </div>
  );
}
