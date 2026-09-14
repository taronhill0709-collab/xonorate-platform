import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { ResourceReorderTable } from "./resource-reorder-table";
import { db } from "@/db";
import { resources } from "@/db/schema";

export default async function AdminResourcesPage() {
  const rows = await db
    .select({
      id: resources.id,
      title: resources.title,
      category: resources.category,
      resourceType: resources.resourceType,
      status: resources.status,
      featured: resources.featured,
    })
    .from(resources)
    .orderBy(asc(resources.sortOrder), desc(resources.createdAt));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Resource Center</h1>
          <p className="mt-1 text-sm text-muted">
            Guides, legal resources, organizations, and tools shown on the public Resource Center. Publish a draft to
            send it live. Only one resource can be Featured at a time — setting a new one unfeatures the last.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          New
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing here yet. Create the first resource directly.</p>
      ) : (
        <ResourceReorderTable initialRows={rows} />
      )}
    </div>
  );
}
