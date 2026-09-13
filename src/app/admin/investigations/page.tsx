import { desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { investigations } from "@/db/schema";
import { INVESTIGATION_STATUS_LABEL, INVESTIGATION_STATUS_TONE } from "@/lib/investigation-status";

export default async function AdminInvestigationsPage() {
  const rows = await db.select().from(investigations).orderBy(desc(investigations.updatedAt));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Xonorate Investigations</h1>
          <p className="mt-1 text-sm text-muted">
            Xonorate&apos;s highest editorial tier — original investigative work, not aggregated news.
            Start one from a flagged opportunity in{" "}
            <Link href="/admin/intelligence" className="underline">
              Xonorate Intelligence
            </Link>
            , or create one directly.
          </p>
        </div>
        <Link
          href="/admin/investigations/new"
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          New
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No investigations yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">
                  <Link href={`/admin/investigations/${row.id}`} className="underline">
                    {row.title}
                  </Link>
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={INVESTIGATION_STATUS_TONE[row.status]}>
                      {INVESTIGATION_STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                    {row.isFeatured && <Badge tone="brand">Featured</Badge>}
                  </div>
                </td>
                <td className="py-2 text-muted">
                  {row.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
