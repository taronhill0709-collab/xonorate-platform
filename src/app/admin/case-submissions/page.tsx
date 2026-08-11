import { and, desc, eq, lte } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { inquiries, inquiryStatusEnum } from "@/db/schema";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry-status";

const FOLLOW_UP_DEADLINE_DAYS = 14;

const TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "needs_more_info", label: "Needs more info" },
  { key: "needs_follow_up", label: `Needs follow-up (${FOLLOW_UP_DEADLINE_DAYS}+ days)` },
  { key: "under_review", label: "Under review" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function badgeTone(status: string): "brand" | "danger" | "neutral" {
  if (status === "accepted") return "brand";
  if (status === "declined") return "danger";
  return "neutral";
}

function followUpDeadline(): Date {
  return new Date(Date.now() - FOLLOW_UP_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
}

export default async function AdminCaseSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeTab: TabKey = TABS.some((t) => t.key === statusParam)
    ? (statusParam as TabKey)
    : "all";

  const deadline = followUpDeadline();

  const where =
    activeTab === "all"
      ? undefined
      : activeTab === "needs_follow_up"
        ? and(eq(inquiries.status, "needs_more_info"), lte(inquiries.infoRequestedAt, deadline))
        : eq(inquiries.status, activeTab as (typeof inquiryStatusEnum.enumValues)[number]);

  const rows = await db
    .select()
    .from(inquiries)
    .where(where)
    .orderBy(desc(inquiries.createdAt));

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Case submissions</h1>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={
              tab.key === "all"
                ? "/admin/case-submissions"
                : `/admin/case-submissions?status=${tab.key}`
            }
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeTab === tab.key
                ? "bg-brand text-brand-foreground"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No case submissions here.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/case-submissions/${row.id}`}
              className="block rounded-lg border border-border p-4 text-sm transition hover:border-brand"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {row.personName} <span className="text-muted">· {row.state}</span>
                </p>
                <Badge tone={badgeTone(row.status)}>
                  {INQUIRY_STATUS_LABEL[row.status] ?? row.status}
                </Badge>
              </div>
              <p className="mt-1 text-muted">
                Submitted by {row.submitterName} ({row.submitterEmail}) —{" "}
                {row.relationshipToPerson}
              </p>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-foreground">
                {row.caseSummary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
