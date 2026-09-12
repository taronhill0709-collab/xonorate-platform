"use client";

import { Eye, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatCompactCount } from "@/lib/format-count";

export type PublicCaseVideo = {
  id: string;
  platform: "instagram" | "facebook";
  postUrl: string;
  title: string;
  thumbnailUrl: string | null;
  views: number;
};

const PLATFORM_LABEL: Record<PublicCaseVideo["platform"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
};

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
    FB?: { XFBML: { parse: (el?: HTMLElement) => void } };
  }
}

const EMBED_SCRIPT_SRC: Record<PublicCaseVideo["platform"], string> = {
  instagram: "https://www.instagram.com/embed.js",
  facebook: "https://connect.facebook.com/en_US/sdk.js#xfbml=1&version=v19.0",
};

// Loads a platform's embed script at most once per page, even though the
// case page's "more clips" grid can have several Instagram/Facebook cards
// on screen at once — later calls reuse the same in-flight/settled promise
// instead of injecting duplicate <script> tags.
const scriptPromises = new Map<string, Promise<void>>();
function loadEmbedScript(src: string): Promise<void> {
  let promise = scriptPromises.get(src);
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
    scriptPromises.set(src, promise);
  }
  return promise;
}

/** Renders Instagram/Facebook's own official embed widget (their standard
 * "Embed" markup — no Meta app credentials required, unlike the Graph API).
 * That means it plays with the platform's own chrome/branding, not a fully
 * custom-skinned player — a fully chromeless in-house player would need a
 * registered Meta app and access tokens this project doesn't have. */
function SocialEmbed({
  platform,
  postUrl,
  width,
}: {
  platform: PublicCaseVideo["platform"];
  postUrl: string;
  width: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;

    function process() {
      if (platform === "instagram") {
        window.instgrm?.Embeds.process();
      } else {
        window.FB?.XFBML.parse();
      }
    }

    if (platform === "facebook" && !document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }

    loadEmbedScript(EMBED_SCRIPT_SRC[platform])
      .then(() => {
        if (cancelled) return;
        process();
        // The widget replaces our placeholder with an <iframe> once it
        // actually renders — poll for that instead of trusting the script
        // load alone, since `process()` can silently no-op if called a beat
        // before the SDK finishes initializing. Retry once, then give up.
        pollTimer = setInterval(() => {
          if (cancelled) return;
          if (containerRef.current?.querySelector("iframe")) {
            setStatus("ready");
            clearInterval(pollTimer);
            return;
          }
          attempts += 1;
          if (attempts === 6) process(); // one retry, ~3s in
          if (attempts >= 14) {
            setStatus("error");
            clearInterval(pollTimer);
          }
        }, 500);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [platform, postUrl]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <p className="text-sm text-header-muted">Couldn&apos;t load the video here.</p>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-link uppercase hover:text-link-strong"
        >
          Watch on {platform === "instagram" ? "Instagram" : "Facebook"} ↗
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {status === "loading" && (
        <p className="p-6 text-center font-mono text-xs text-header-muted uppercase">Loading…</p>
      )}
      {platform === "instagram" ? (
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={postUrl}
          data-instgrm-version="14"
          style={{ width: "100%", margin: 0 }}
        >
          <a href={postUrl} target="_blank" rel="noopener noreferrer">
            View this post on Instagram
          </a>
        </blockquote>
      ) : (
        <div className="fb-video" data-href={postUrl} data-width={width} data-show-text="false" />
      )}
    </div>
  );
}

/** A social-video card. Poster state opens the platform's real embedded
 * player inline on click (Instagram/Facebook's own official embed widget —
 * see SocialEmbed above); a small link back to the original post stays
 * available separately wherever this card is used, for anyone who wants to
 * leave the platform and watch/like/comment there directly. Matches the
 * site's existing photographic-card treatment (sharp corners, full-bleed
 * image, dark gradient, caption overlaid at the bottom) rather than a
 * generic rounded media card. */
export function VideoCard({
  video,
  size = "large",
  ribbon,
}: {
  video: PublicCaseVideo;
  size?: "large" | "small";
  ribbon?: string;
}) {
  const large = size === "large";
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      // min-width matches Instagram/Facebook's own embed widget, which
      // never shrinks below ~326px — a narrower grid cell (the "more
      // clips" row, a tablet-width sidebar) means this intentionally
      // overflows its column rather than getting clipped or squished.
      <div className="relative z-10 min-w-[326px] border border-header-border bg-header-border/20">
        <button
          type="button"
          onClick={() => setPlaying(false)}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
          aria-label="Close video"
        >
          <X className="h-4 w-4" />
        </button>
        <SocialEmbed platform={video.platform} postUrl={video.postUrl} width={large ? 400 : 250} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-9/16 w-full overflow-hidden border border-header-border bg-header-border/20 text-left"
    >
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes={large ? "(min-width: 1024px) 300px, 70vw" : "(min-width: 1024px) 200px, 45vw"}
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-header-border via-header-background to-black p-4">
          <p
            className={`text-center font-serif text-header-foreground/60 ${large ? "text-xl" : "text-sm"}`}
          >
            {video.title}
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      {ribbon && (
        <span className="absolute top-2.5 left-2.5 bg-brand px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-brand-foreground uppercase">
          {ribbon}
        </span>
      )}
      <span className="absolute top-2.5 right-2.5 border border-white/25 bg-black/40 px-2 py-1 font-mono text-[9px] tracking-wide text-white uppercase backdrop-blur-sm">
        {PLATFORM_LABEL[video.platform]}
      </span>

      <span
        className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 transition group-hover:scale-110 ${
          large ? "h-14 w-14" : "h-9 w-9"
        }`}
        aria-hidden
      >
        <Play
          className={large ? "ml-0.5 h-5 w-5 text-black" : "ml-0.5 h-3.5 w-3.5 text-black"}
          fill="currentColor"
        />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p
          className={`font-serif text-white ${large ? "line-clamp-2 text-lg" : "line-clamp-1 text-sm"}`}
        >
          {video.title}
        </p>
        <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-white/80">
          <Eye className="h-3 w-3" aria-hidden />
          {formatCompactCount(video.views)}
        </p>
      </div>
    </button>
  );
}
