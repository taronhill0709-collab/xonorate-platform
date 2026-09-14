import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { ResourcesBrowser } from "@/components/resources-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { resources } from "@/db/schema";

export const metadata: Metadata = {
  title: "Browse Resources",
  description: "Search and filter every resource in the Xonorate Resource Center by category, type, audience, and state.",
};

// New resources are added via the admin CMS at any time — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function ResourcesBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
      category: resources.category,
      subcategory: resources.subcategory,
      resourceType: resources.resourceType,
      audiences: resources.audiences,
      state: resources.state,
      description: resources.description,
      url: resources.url,
      featured: resources.featured,
    })
    .from(resources)
    .where(eq(resources.status, "published"))
    .orderBy(asc(resources.sortOrder), desc(resources.createdAt));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <Eyebrow text="Xonorate Resource Center" />
            <h1 className="mt-2 font-serif text-4xl text-header-foreground sm:text-6xl">
              Browse every resource.
            </h1>
            <p className="mt-3 max-w-xl text-header-muted">
              Search and filter guides, legal resources, organizations, and tools for understanding and responding to
              a wrongful conviction.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No resources published yet.</p>
          ) : (
            <ResourcesBrowser rows={rows} initialCategory={category ?? "all"} initialQuery={q ?? ""} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
