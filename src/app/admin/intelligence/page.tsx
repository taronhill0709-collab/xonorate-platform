import { and, count, desc, eq, gte, inArray, ne, type SQL } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/app/admin/_components/field";
import { startInvestigationFromIntelligence } from "@/app/admin/investigations/actions";
import { db } from "@/db";
import { cases, intelligenceItems, intelligenceStatusEnum, investigations, posts } from "@/db/schema";
import {
  CONTENT_OPPORTUNITY_LABEL,
  CREATE_WITH_THIS_POST_TYPES,
  EDITORIAL_SIGNAL_LABEL,
  EDITORIAL_SIGNAL_TONE,
  INTELLIGENCE_STATUS_LABEL,
} from "@/lib/intelligence";
import { ISSUES } from "@/lib/issues";
import { POST_TYPE_LABEL } from "@/lib/post-type";
import { rejectIntelligenceItem } from "./actions";

const ISSUE_TITLE_BY_TAG = new Map(ISSUES.map((i) => [i.tag, i.title]));

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "used", label: "Used" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;
type StatusTab = (typeof STATUS_TABS)[number]["key"];

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Each dashboard tile that isn't just a status count (see STATUS_TABS above
// for those) gets its own filter here, so every tile is clickable into the
// exact subset it's counting — matching the query each one runs in
// getCounts() below. "Pending review" reuses the existing status=new tab
// instead of living here, since that count IS just the "New" status.
const TILE_FILTERS: Record<string, { label: string; where: () => SQL | undefined }> = {
  today: {
    label: "Discovered today",
    where: () => {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      return gte(intelligenceItems.createdAt, todayStart);
    },
  },
  high_priority: {
    label: "High priority",
    where: () =>
      and(eq(intelligenceItems.editorialSignal, "high_priority"), ne(intelligenceItems.status, "rejected")),
  },
  case_development: {
    label: "Case developments",
    where: () =>
      and(
        eq(intelligenceItems.contentOpportunity, "case_development"),
        inArray(intelligenceItems.status, ["new", "reviewed"]),
      ),
  },
  investigation: {
    label: "Investigation opportunities",
    where: () =>
      and(
        eq(intelligenceItems.contentOpportunity, "investigation"),
        inArray(intelligenceItems.status, ["new", "reviewed"]),
      ),
  },
};

async function getCounts() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    [discoveredToday],
    [pendingReview],
    [highPriority],
    [caseDevelopmentOpportunities],
    [investigationOpportunities],
    [readyToPublish],
    [activeInvestigations],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(intelligenceItems)
      .where(gte(intelligenceItems.createdAt, todayStart)),
    db.select({ value: count() }).from(intelligenceItems).where(eq(intelligenceItems.status, "new")),
    db
      .select({ value: count() })
      .from(intelligenceItems)
      .where(and(eq(intelligenceItems.editorialSignal, "high_priority"), ne(intelligenceItems.status, "rejected"))),
    // "Opportunities" means not yet acted on — excludes items already
    // rejected OR already turned into content ("used"), unlike a plain
    // ne(status, "rejected") which would still count a used item.
    db
      .select({ value: count() })
      .from(intelligenceItems)
      .where(
        and(
          eq(intelligenceItems.contentOpportunity, "case_development"),
          inArray(intelligenceItems.status, ["new", "reviewed"]),
        ),
      ),
    db
      .select({ value: count() })
      .from(intelligenceItems)
      .where(
        and(
          eq(intelligenceItems.contentOpportunity, "investigation"),
          inArray(intelligenceItems.status, ["new", "reviewed"]),
        ),
      ),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "pending")),
    db.select({ value: count() }).from(investigations).where(ne(investigations.status, "published")),
  ]);

  return {
    discoveredToday: discoveredToday.value,
    pendingReview: pendingReview.value,
    highPriority: highPriority.value,
    caseDevelopmentOpportunities: caseDevelopmentOpportunities.value,
    investigationOpportunities: investigationOpportunities.value,
    readyToPublish: readyToPublish.value,
    activeInvestigations: activeInvestigations.value,
  };
}

export default async function AdminIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; filter?: string }>;
}) {
  const { status: statusParam, filter: filterParam } = await searchParams;
  const activeFilter = filterParam && filterParam in TILE_FILTERS ? filterParam : null;
  const activeTab: StatusTab = STATUS_TABS.some((t) => t.key === statusParam) ? (statusParam as StatusTab) : "active";

  const where = activeFilter
    ? TILE_FILTERS[activeFilter].where()
    : activeTab === "all"
      ? undefined
      : activeTab === "active"
        ? inArray(intelligenceItems.status, ["new", "reviewed"])
        : eq(intelligenceItems.status, activeTab as (typeof intelligenceStatusEnum.enumValues)[number]);

  const [counts, items, caseRows] = await Promise.all([
    getCounts(),
    db.select().from(intelligenceItems).where(where).orderBy(desc(intelligenceItems.createdAt)).limit(100),
    db.select({ id: cases.id, clientName: cases.clientName }).from(cases),
  ]);

  const caseById = new Map(caseRows.map((c) => [c.id, c]));

  // Group same-event items discovered together (see clusterKey in
  // content-pipeline.ts) into one "story cluster" card instead of N
  // separate opportunities.
  const clusters = new Map<string, typeof items>();
  const standalone: typeof items = [];
  for (const item of items) {
    if (item.clusterId) {
      const group = clusters.get(item.clusterId) ?? [];
      group.push(item);
      clusters.set(item.clusterId, group);
    } else {
      standalone.push(item);
    }
  }
  const cards = [
    ...Array.from(clusters.values()).map((group) => ({ lead: group[0], group })),
    ...standalone.map((item) => ({ lead: item, group: [item] })),
  ].sort((a, b) => b.lead.createdAt.getTime() - a.lead.createdAt.getTime());

  const tiles = [
    { label: "Discovered today", value: counts.discoveredToday, href: "/admin/intelligence?filter=today" },
    { label: "Pending review", value: counts.pendingReview, href: "/admin/intelligence?status=new" },
    { label: "High priority", value: counts.highPriority, href: "/admin/intelligence?filter=high_priority" },
    {
      label: "Case developments",
      value: counts.caseDevelopmentOpportunities,
      href: "/admin/intelligence?filter=case_development",
    },
    {
      label: "Investigation opportunities",
      value: counts.investigationOpportunities,
      href: "/admin/intelligence?filter=investigation",
    },
    { label: "Ready to publish", value: counts.readyToPublish, href: "/admin/posts" },
    { label: "Active investigations", value: counts.activeInvestigations, href: "/admin/investigations" },
  ];

  return (
    <div>
      <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">Xonorate Intelligence</p>
      <h1 className="mt-1 font-serif text-2xl text-foreground">Today&apos;s discoveries</h1>
      <p className="mt-1 text-sm text-muted">
        Automation discovers what&apos;s happening. You decide what matters — review each item below,
        then Create With This to turn it into real Xonorate content. Nothing here publishes on its own.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {tiles.map((tile) => {
          const content = (
            <>
              <p className="font-serif text-2xl font-extrabold tracking-tight text-brand tabular-nums">
                {tile.value}
              </p>
              <p className="mt-1 font-mono text-[11px] font-bold tracking-wide text-label uppercase">
                {tile.label}
              </p>
            </>
          );
          return tile.href ? (
            <Link
              key={tile.label}
              href={tile.href}
              className="border border-border bg-muted-background p-3 transition hover:border-brand"
            >
              {content}
            </Link>
          ) : (
            <div key={tile.label} className="border border-border bg-muted-background p-3">
              {content}
            </div>
          );
        })}
      </div>

      {activeFilter && (
        <p className="mt-6 text-sm text-muted">
          Showing: <span className="font-medium text-foreground">{TILE_FILTERS[activeFilter].label}</span> ·{" "}
          <Link href="/admin/intelligence" className="text-brand underline">
            Clear filter
          </Link>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "active" ? "/admin/intelligence" : `/admin/intelligence?status=${tab.key}`}
              className={`rounded-full px-3 py-1 text-sm transition ${
                !activeFilter && activeTab === tab.key
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-4">
          <Link href="/admin/investigations" className="text-sm text-brand underline">
            Investigations →
          </Link>
          <Link href="/admin/intelligence/sources" className="text-sm text-brand underline">
            Source Library →
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nothing here. The daily discovery job stages new items here every morning.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {cards.map(({ lead, group }) => {
            const suggestedCase = lead.suggestedCaseId ? caseById.get(lead.suggestedCaseId) : null;
            const issueTags = (lead.issueTags as string[]) ?? [];
            const isCluster = group.length > 1;

            return (
              <div key={lead.id} className="rounded-lg border border-border p-4">
                {isCluster && (
                  <p className="mb-2 font-mono text-[11px] font-bold tracking-widest text-label uppercase">
                    Story cluster · {group.length} sources
                  </p>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg text-foreground">{lead.headline}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {lead.sourcePublication}
                      {lead.publishedAt && ` · ${DATE_FORMAT.format(lead.publishedAt)}`}
                      {lead.state && ` · ${lead.state}`}
                    </p>
                  </div>
                  <Badge tone={EDITORIAL_SIGNAL_TONE[lead.editorialSignal]}>
                    {EDITORIAL_SIGNAL_LABEL[lead.editorialSignal]}
                  </Badge>
                </div>

                <p className="mt-2 text-sm text-foreground">{lead.summary}</p>

                {lead.whyThisMatters && (
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-medium text-foreground">Why this matters: </span>
                    {lead.whyThisMatters}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {issueTags.map((tag) => (
                    <Badge key={tag}>{ISSUE_TITLE_BY_TAG.get(tag) ?? tag}</Badge>
                  ))}
                  {lead.contentOpportunity && (
                    <Badge tone="brand">Suggested: {CONTENT_OPPORTUNITY_LABEL[lead.contentOpportunity]}</Badge>
                  )}
                  {suggestedCase && <Badge>Potential case: {suggestedCase.clientName}</Badge>}
                  <Badge>{INTELLIGENCE_STATUS_LABEL[lead.status]}</Badge>
                </div>

                {isCluster && (
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {group.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand underline"
                        >
                          {item.sourcePublication}
                        </a>{" "}
                        — {item.headline}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand underline"
                  >
                    Open source →
                  </a>

                  <span className="text-muted">Create with this:</span>
                  {CREATE_WITH_THIS_POST_TYPES.map((type) => (
                    <Link
                      key={type}
                      href={`/admin/posts/new?fromIntelligence=${lead.id}&type=${type}`}
                      className="text-brand underline"
                    >
                      {POST_TYPE_LABEL[type]}
                    </Link>
                  ))}
                  <form action={startInvestigationFromIntelligence.bind(null, lead.id)}>
                    <button type="submit" className="font-medium text-brand underline">
                      Start investigation →
                    </button>
                  </form>

                  {lead.status !== "rejected" && (
                    <form action={rejectIntelligenceItem.bind(null, lead.id)} className="ml-auto">
                      <button type="submit" className="text-muted underline">
                        Not relevant
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
