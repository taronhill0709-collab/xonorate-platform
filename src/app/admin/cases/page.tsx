import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { cases } from "@/db/schema";

export default async function AdminCasesPage() {
  const rows = await db.select().from(cases).orderBy(desc(cases.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Cases</h1>
        <Link
          href="/admin/cases/new"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          New case
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No cases yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Client</th>
              <th className="py-2 font-medium">State</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">{row.clientName}</td>
                <td className="py-2 text-foreground">{row.state}</td>
                <td className="py-2 text-foreground">{row.status}</td>
                <td className="py-2 text-right">
                  <Link href={`/admin/cases/${row.id}/edit`} className="text-brand underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
