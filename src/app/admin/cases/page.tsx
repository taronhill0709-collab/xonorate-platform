import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { deleteCase } from "./actions";
import { CaseReorderButtons } from "./case-reorder-buttons";
import { CaseStatusSelect } from "./case-status-select";
import { DeleteCaseButton } from "./delete-case-button";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { listCaseNreCandidates } from "@/lib/case-nre-candidates";

export default async function AdminCasesPage() {
  const [rows, candidates] = await Promise.all([
    db.select().from(cases).orderBy(asc(cases.sortOrder), desc(cases.createdAt)),
    listCaseNreCandidates(),
  ]);

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

      {candidates.length > 0 && (
        <Link
          href="/admin/cases/candidates"
          className="mt-4 block rounded-md border border-brand/40 bg-brand/5 px-4 py-2.5 text-sm text-foreground underline-offset-2 hover:underline"
        >
          {candidates.length} exoneree candidate{candidates.length === 1 ? "" : "s"} awaiting review →
        </Link>
      )}
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No cases yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 font-medium" />
              <th className="py-2 font-mono text-[0.68rem] font-normal tracking-widest text-muted uppercase">
                Client
              </th>
              <th className="py-2 font-mono text-[0.68rem] font-normal tracking-widest text-muted uppercase">
                State
              </th>
              <th className="py-2 font-mono text-[0.68rem] font-normal tracking-widest text-muted uppercase">
                Status
              </th>
              <th className="py-2 font-mono text-[0.68rem] font-normal tracking-widest text-muted uppercase">
                Views
              </th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b border-border hover:bg-muted-background">
                <td className="py-3">
                  <CaseReorderButtons
                    caseId={row.id}
                    isFirst={i === 0}
                    isLast={i === rows.length - 1}
                  />
                </td>
                <td className="py-3 font-medium text-foreground">
                  {row.clientName}
                  {!row.isClient && (
                    <span className="ml-2 inline-flex items-center border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted uppercase">
                      Spotlight
                    </span>
                  )}
                </td>
                <td className="py-3 text-foreground">{row.state}</td>
                <td className="py-3">
                  <CaseStatusSelect caseId={row.id} status={row.status} />
                </td>
                <td className="py-3 font-semibold text-foreground tabular-nums">
                  {row.viewCount.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  <a
                    href={`/cases/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    View
                  </a>{" "}
                  <Link href={`/admin/cases/${row.id}/edit`} className="text-brand hover:underline">
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
