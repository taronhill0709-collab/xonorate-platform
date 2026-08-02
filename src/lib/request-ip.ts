import { headers } from "next/headers";

/** Client IP for rate-limiting. Netlify sets x-nf-client-connection-ip on every request. */
export async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  const netlifyIp = headersList.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp;

  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;

  return null;
}

/** Absolute origin for building links in emails, derived from the request rather than an env var so it's correct in dev, deploy previews, and production alike. */
export async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

/** og:image/twitter:image require an absolute URL — uploaded photos are
 * stored as site-relative paths (e.g. /api/case-photos/xxx), while legacy
 * rows may still hold an absolute URL pasted in directly. Resolves either
 * against origin without double-prefixing the already-absolute case. */
export function resolveShareImage(
  url: string | null | undefined,
  origin: string,
  fallback: string,
): string {
  return url ? new URL(url, origin).toString() : fallback;
}
