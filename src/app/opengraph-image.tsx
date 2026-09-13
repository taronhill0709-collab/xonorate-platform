import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getCasePhoto } from "@/lib/case-photo-storage";

export const alt = "Xonorate Media Platform — advocating for the wrongfully convicted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Renders per-request rather than once at build time: the custom hero photo
// (below) lives in Netlify Blobs, which — unlike the DB — has no build-time
// context to read from during `next build`'s static generation pass. A
// build-time render would silently produce a photo-less card (confirmed
// live: the DB query succeeds at build time, but the photo never resolves).
export const dynamic = "force-dynamic";

const CASE_PHOTO_PATH_RE = /^\/api\/case-photos\/(.+)$/;

/** Mirrors the homepage hero's own fallback logic (see page.tsx): an
 * admin-uploaded custom hero photo if one is set, otherwise the bundled
 * default. Returns a data URI — satori (which next/og's ImageResponse runs
 * on) needs actual image bytes, not a bare path/URL it would have to
 * resolve itself. Swallows DB/fetch failures and falls back to no photo
 * (a plain dark card, like this route used to always render) rather than
 * ever breaking the share preview. */
async function resolveHeroImageDataUrl(): Promise<string | null> {
  let customUrl: string | null = null;
  try {
    const [settings] = await db
      .select({ heroImageUrl: siteSettings.heroImageUrl })
      .from(siteSettings)
      .where(eq(siteSettings.id, "singleton"))
      .limit(1);
    customUrl = settings?.heroImageUrl ?? null;
  } catch (err) {
    // No DB connection in this environment — fall through to the bundled
    // default hero photo below rather than failing the whole image.
    console.error("[opengraph-image] siteSettings query failed", err);
  }

  try {
    // Admin-uploaded hero photos are almost always our own /api/case-photos
    // route backed by Netlify Blobs (see case-photo-storage.ts) — read the
    // blob directly instead of fetching our own route over HTTP, which has
    // no reliable target during static generation and is pointless latency
    // even when it works. A legacy row could still hold a real external URL,
    // so that's kept as a fallback.
    if (customUrl) {
      const blobMatch = customUrl.match(CASE_PHOTO_PATH_RE);
      if (blobMatch) {
        const photo = await getCasePhoto(blobMatch[1]);
        if (!photo) throw new Error(`case photo not found: ${blobMatch[1]}`);
        return `data:${photo.contentType};base64,${Buffer.from(photo.data).toString("base64")}`;
      }

      const res = await fetch(customUrl);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const type = res.headers.get("content-type") ?? "image/jpeg";
      return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
    }
    const filePath = path.join(process.cwd(), "public", "images", "hero-courthouse.png");
    const fileBuffer = await fs.readFile(filePath);
    return `data:image/png;base64,${fileBuffer.toString("base64")}`;
  } catch (err) {
    console.error("[opengraph-image] hero image load failed", { customUrl }, err);
    return null;
  }
}

export default async function Image() {
  const heroImage = await resolveHeroImageDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#050505",
        }}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
            }}
          />
        )}

        {/* Same dark gradient treatment as the homepage hero (page.tsx),
            so the share card and the actual page read as one thing. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(to top, #050505 15%, rgba(5,5,5,0.75) 50%, rgba(5,5,5,0.25) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            <span style={{ color: "#d11f2c" }}>X</span>
            <span style={{ color: "#f4f3f0" }}>onorate</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#98958c",
            }}
          >
            Wrongful convictions. Exposed.
          </div>

          <div
            style={{
              display: "flex",
              maxWidth: 1000,
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.12,
              color: "#f4f3f0",
              marginTop: 18,
            }}
          >
            When the system gets it wrong, we make sure the world knows.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
