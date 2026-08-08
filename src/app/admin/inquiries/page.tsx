import { desc } from "drizzle-orm";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { generalInquiries } from "@/db/schema";
import { GENERAL_INQUIRY_STATUS_LABEL } from "@/lib/general-inquiry-status";
import { setGeneralInquiryStatus } from "./actions";

export default async function AdminInquiriesPage() {
  const rows = await db.select().from(generalInquiries).orderBy(desc(generalInquiries.createdAt));

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Inquiries</h1>
      <p className="mt-1 text-sm text-muted">
        General questions and messages — not full case submissions. See{" "}
        <a href="/admin/case-submissions" className="text-brand underline">
          Case submissions
        </a>{" "}
        for those.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No inquiries yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{row.name}</p>
                <Badge tone={row.status === "responded" ? "brand" : "neutral"}>
                  {GENERAL_INQUIRY_STATUS_LABEL[row.status] ?? row.status}
                </Badge>
              </div>
              <p className="mt-1 text-muted">{row.email}</p>
              <p className="mt-2 whitespace-pre-line text-foreground">{row.message}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {row.status === "new" && (
                  <form action={setGeneralInquiryStatus.bind(null, row.id, "responded")}>
                    <button type="submit" className="text-brand underline">
                      Mark as responded
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
