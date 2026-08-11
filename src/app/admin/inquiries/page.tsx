import { desc } from "drizzle-orm";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { generalInquiries } from "@/db/schema";
import { GENERAL_INQUIRY_STATUS_LABEL } from "@/lib/general-inquiry-status";
import { replyToGeneralInquiry } from "./actions";

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
        for those. Replying below emails the sender directly at the address they submitted.
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

              {row.adminReply && (
                <div className="mt-3 rounded-md border border-border bg-muted-background p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Your reply
                    {row.respondedAt &&
                      ` — sent ${row.respondedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}`}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-foreground">{row.adminReply}</p>
                </div>
              )}

              <form action={replyToGeneralInquiry.bind(null, row.id)} className="mt-3 space-y-2">
                <textarea
                  name="reply"
                  rows={3}
                  required
                  placeholder={
                    row.status === "responded" ? "Send a follow-up reply…" : "Write a reply…"
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button type="submit" className="text-brand underline">
                  {row.status === "responded" ? "Send follow-up" : "Send reply"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
