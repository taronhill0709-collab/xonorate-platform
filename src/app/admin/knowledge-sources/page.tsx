import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { knowledgeSources } from "@/db/schema";
import { AUTHORITY_TIER_LABEL, KNOWLEDGE_SOURCE_KIND_LABEL, KNOWLEDGE_SOURCE_STATUS_LABEL } from "@/lib/knowledge-sources";

export default async function AdminKnowledgeSourcesPage() {
  const rows = await db
    .select({
      id: knowledgeSources.id,
      title: knowledgeSources.title,
      sourceKind: knowledgeSources.sourceKind,
      authorityTier: knowledgeSources.authorityTier,
      status: knowledgeSources.status,
      jurisdiction: knowledgeSources.jurisdiction,
    })
    .from(knowledgeSources)
    .orderBy(desc(knowledgeSources.createdAt));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Knowledge Sources</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The curated library of legal authorities, research, and organizations that Ask Xonorate and Resource
            Center pages may cite. Only <strong>Approved</strong> rows are retrievable — nothing here is
            AI-generated; every row should be entered and fact-checked by an editor.
          </p>
        </div>
        <Link
          href="/admin/knowledge-sources/new"
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          New
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing here yet. Add the first source directly.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="py-2">Title</th>
              <th className="py-2">Kind</th>
              <th className="py-2">Tier</th>
              <th className="py-2">Jurisdiction</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-2">
                  <Link href={`/admin/knowledge-sources/${r.id}`} className="text-foreground hover:text-brand">
                    {r.title}
                  </Link>
                </td>
                <td className="py-2 text-muted">{KNOWLEDGE_SOURCE_KIND_LABEL[r.sourceKind] ?? r.sourceKind}</td>
                <td className="py-2 text-muted">{AUTHORITY_TIER_LABEL[r.authorityTier] ?? r.authorityTier}</td>
                <td className="py-2 text-muted">{r.jurisdiction ?? "—"}</td>
                <td className="py-2 text-muted">{KNOWLEDGE_SOURCE_STATUS_LABEL[r.status] ?? r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
