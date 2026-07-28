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

  // Facebook's share dialog expects to run in a popup it opened itself — a
  // plain new-tab link often just dumps the visitor on facebook.com instead
  // of the composer, especially when they're not already logged in.
  function openSharePopup(shareUrl: string) {
    window.open(
      shareUrl,
      "share-popup",
      "width=600,height=520,noopener,noreferrer",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        onClick={handleCopy}
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        onClick={() =>
          openSharePopup(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          )
        }
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Share on X
      </button>
      <button
        onClick={() =>
          openSharePopup(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          )
        }
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Share on Facebook
      </button>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className="rounded-md border border-border px-3 py-1.5 text-foreground transition hover:bg-muted-background"
      >
        Email
      </a>
    </div>
  );
}
