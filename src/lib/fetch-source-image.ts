const FETCH_TIMEOUT_MS = 5000;
// og:image lives in <head>, almost always well within the first 200KB —
// capping the read avoids downloading a large article's full body/images.
const MAX_BYTES = 200_000;

const META_PATTERNS = (name: string) => [
  new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"),
  new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, "i"),
];

function extractMetaContent(html: string, name: string): string | null {
  for (const pattern of META_PATTERNS(name)) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let html = "";
  let bytesRead = 0;

  while (bytesRead < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    html += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return html;
}

/** Fetches a source article's page and pulls its preview image (og:image,
 * falling back to twitter:image), resolved to an absolute URL. Returns null
 * on any failure — a missing thumbnail should never break post generation. */
export async function fetchSourceImage(sourceUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; XonorateBot/1.0; +https://xonorate.com)",
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return null;

    const html = await readCapped(res);
    const raw =
      extractMetaContent(html, "og:image:secure_url") ??
      extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "twitter:image");
    if (!raw) return null;

    const resolved = new URL(raw, res.url);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

/** Tries each source in order and returns the first usable image. */
export async function fetchFirstSourceImage(
  sources: { url: string }[],
): Promise<string | null> {
  for (const source of sources) {
    const image = await fetchSourceImage(source.url);
    if (image) return image;
  }
  return null;
}
