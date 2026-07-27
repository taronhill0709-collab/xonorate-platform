import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { comments, inquiries, signatures } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Each of these tables already stores ip_address, so rate limits reuse the
 * table itself rather than adding separate rate-limit infrastructure —
 * good enough for this volume, and keeps the schema minimal. Missing IP
 * (e.g. no forwarding header) is not rate-limited rather than blocking
 * legitimate submitters.
 */

export async function isSignatureRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ value: count() })
    .from(signatures)
    .where(and(eq(signatures.ipAddress, ip), gte(signatures.createdAt, since)));
  return (row?.value ?? 0) >= 8;
}

export async function isCommentRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ value: count() })
    .from(comments)
    .where(and(eq(comments.ipAddress, ip), gte(comments.createdAt, since)));
  return (row?.value ?? 0) >= 10;
}

export async function isInquiryRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ value: count() })
    .from(inquiries)
    .where(and(eq(inquiries.ipAddress, ip), gte(inquiries.createdAt, since)));
  return (row?.value ?? 0) >= 5;
}
