import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { cases, petitions, posts } from "@/db/schema";
import { ISSUES } from "@/lib/issues";
import { getSiteOrigin } from "@/lib/site-url";

// Must be generated per-request, not at build time — the build environment's
// database has no migrations applied yet (mirrors the reasoning behind
// `dynamic = "force-dynamic"` on every other DB-backed route in this app).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();

  const [caseRows, petitionRows, postRows] = await Promise.all([
    db.select({ slug: cases.slug, updatedAt: cases.updatedAt }).from(cases),
    db
      .select({ slug: petitions.slug, createdAt: petitions.createdAt })
      .from(petitions)
      .where(eq(petitions.status, "published")),
    db
      .select({ slug: posts.slug, publishedAt: posts.publishedAt, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.status, "published")),
  ]);

  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/cases`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/petitions`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/impact`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${origin}/exonerated`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/issues`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/take-action`, changeFrequency: "daily", priority: 0.8 },
    ...ISSUES.map((issue) => ({
      url: `${origin}/issues/${issue.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...caseRows.map((c) => ({
      url: `${origin}/cases/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...petitionRows.map((p) => ({
      url: `${origin}/petitions/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...postRows.map((p) => ({
      url: `${origin}/news/${p.slug}`,
      lastModified: p.publishedAt ?? p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
