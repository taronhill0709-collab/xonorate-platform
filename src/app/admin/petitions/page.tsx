import { and, count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { petitions, signatures } from "@/db/schema";

export default async function AdminPetitionsPage() {
  const rows = await db
    .select()
    .from(petitions)
    .orderBy(desc(petitions.createdAt));

  const counts = await Promise.all(
    rows.map((row) =>
      db
        .select({ value: count() })
        .from(signatures)
        .where(and(eq(signatures.petitionId, row.id), eq(signatures.verified, true)))
        .then(([r]) => r?.value ?? 0),
    ),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Petitions</h1>
        <Link
          href="/admin/petitions/new"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          New petition
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No petitions yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Signatures</th>
              <th className="py-2 font-medium">Goal</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">{row.title}</td>
                <td className="py-2 text-foreground">{counts[i]}</td>
                <td className="py-2 text-foreground">{row.goalCount}</td>
                <td className="py-2 text-right">
                  <Link href={`/admin/petitions/${row.id}/edit`} className="text-brand underline">
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
