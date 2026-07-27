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
