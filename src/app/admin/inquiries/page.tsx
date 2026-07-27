import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { setInquiryStatus } from "./actions";

export default async function AdminInquiriesPage() {
  const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Inquiries</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No inquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {row.personName} <span className="text-muted">· {row.state}</span>
                </p>
                <span className="text-xs text-muted">{row.status}</span>
              </div>
              <p className="mt-1 text-muted">
                Submitted by {row.submitterName} ({row.submitterEmail}) —{" "}
                {row.relationshipToPerson}
              </p>
              <p className="mt-2 whitespace-pre-line text-foreground">{row.caseSummary}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {row.status === "new" && (
                  <form action={setInquiryStatus.bind(null, row.id, "reviewing")}>
                    <button type="submit" className="text-brand underline">
                      Start review
                    </button>
                  </form>
                )}
                {row.status === "reviewing" && (
                  <form action={setInquiryStatus.bind(null, row.id, "accepted")}>
                    <button type="submit" className="text-brand underline">
                      Accept
                    </button>
                  </form>
                )}
                {(row.status === "new" || row.status === "reviewing") && (
                  <form action={setInquiryStatus.bind(null, row.id, "declined")}>
                    <button type="submit" className="text-red-600 underline">
                      Decline
                    </button>
                  </form>
                )}
                {row.status === "accepted" && (
                  <Link
                    href={{
                      pathname: "/admin/cases/new",
                      query: {
                        clientName: row.personName,
                        state: row.state,
                        summary: row.caseSummary,
                      },
                    }}
                    className="text-brand underline"
                  >
                    Create case from this inquiry
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
