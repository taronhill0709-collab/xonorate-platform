/**
 * Absolute site origin for contexts with no incoming request to derive it
 * from (Netlify Functions, background jobs) — unlike `getOrigin()` in
 * request-ip.ts, which reads the request's Host header.
 */
export function getSiteOrigin(): string {
  return process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "http://localhost:8888";
}
