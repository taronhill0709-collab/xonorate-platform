import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { deleteCase } from "./actions";
import { CaseReorderButtons } from "./case-reorder-buttons";
import { CaseStatusSelect } from "./case-status-select";
import { DeleteCaseButton } from "./delete-case-button";
import { db } from "@/db";
import { cases } from "@/db/schema";

export default async function AdminCasesPage() {
  const rows = await db
    .select()
    .from(cases)
    .orderBy(asc(cases.sortOrder), desc(cases.createdAt));

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
              <th className="py-2 font-medium" />
              <th className="py-2 font-medium">Client</th>
              <th className="py-2 font-medium">State</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Views</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2">
                  <CaseReorderButtons
                    caseId={row.id}
                    isFirst={i === 0}
                    isLast={i === rows.length - 1}
                  />
                </td>
                <td className="py-2 text-foreground">
                  {row.clientName}
                  {!row.isClient && (
                    <span className="ml-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                      Spotlight
                    </span>
                  )}
                </td>
                <td className="py-2 text-foreground">{row.state}</td>
                <td className="py-2">
                  <CaseStatusSelect caseId={row.id} status={row.status} />
                </td>
                <td className="py-2 text-foreground">{row.viewCount.toLocaleString()}</td>
                <td className="py-2 text-right">
                  <a
                    href={`/cases/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline"
                  >
                    View
                  </a>{" "}
                  <Link href={`/admin/cases/${row.id}/edit`} className="text-brand underline">
                    Edit
                  </Link>{" "}
                  <form action={deleteCase.bind(null, row.id)} className="inline">
                    <DeleteCaseButton />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
