import { desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/app/admin/_components/field";
import { db } from "@/db";
import { contentSources, intelligenceItems, investigations, posts } from "@/db/schema";
import { EDITORIAL_SIGNAL_LABEL, EDITORIAL_SIGNAL_TONE, INTELLIGENCE_STATUS_LABEL } from "@/lib/intelligence";

const USED_TABS = [
  { key: "all", label: "All" },
  { key: "unused", label: "Unused" },
  { key: "used", label: "Used" },
] as const;
type UsedTab = (typeof USED_TABS)[number]["key"];

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** A searchable backlog of every story Xonorate Intelligence has ever
 * discovered — "Unused" is the editorial backlog: sources found but not yet
 * turned into anything (spec: "Source Library" / "Unused sources"). */
export default async function SourceLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ used?: string; q?: string }>;
}) {
  const { used: usedParam, q } = await searchParams;
  const activeTab: UsedTab = USED_TABS.some((t) => t.key === usedParam) ? (usedParam as UsedTab) : "all";
  const query = q?.trim().toLowerCase() ?? "";

  const items = await db.select().from(intelligenceItems).orderBy(desc(intelligenceItems.createdAt)).limit(300);

  const usages =
    items.length > 0
      ? await db
          .select({
            intelligenceItemId: contentSources.intelligenceItemId,
            targetType: contentSources.targetType,
            targetId: contentSources.targetId,
          })
          .from(contentSources)
          .where(inArray(contentSources.intelligenceItemId, items.map((i) => i.id)))
      : [];
  const postIds = [...new Set(usages.filter((u) => u.targetType === "post").map((u) => u.targetId))];
  const investigationIds = [
    ...new Set(usages.filter((u) => u.targetType === "investigation").map((u) => u.targetId)),
  ];
  const [postTitles, investigationTitles] = await Promise.all([
    postIds.length > 0
      ? db.select({ id: posts.id, title: posts.title }).from(posts).where(inArray(posts.id, postIds))
      : Promise.resolve([]),
    investigationIds.length > 0
      ? db
          .select({ id: investigations.id, title: investigations.title })
          .from(investigations)
          .where(inArray(investigations.id, investigationIds))
      : Promise.resolve([]),
  ]);
  const titleById = new Map([...postTitles, ...investigationTitles].map((row) => [row.id, row.title]));

  const usedInByItem = new Map<string, string[]>();
  for (const usage of usages) {
    const title = titleById.get(usage.targetId);
    if (!title) continue;
    const label = usage.targetType === "investigation" ? `${title} (Investigation)` : title;
    const list = usedInByItem.get(usage.intelligenceItemId) ?? [];
    list.push(label);
    usedInByItem.set(usage.intelligenceItemId, list);
  }

  const filtered = items.filter((item) => {
    const usedIn = usedInByItem.get(item.id) ?? [];
    if (activeTab === "used" && usedIn.length === 0) return false;
    if (activeTab === "unused" && usedIn.length > 0) return false;
    if (query) {
      const haystack = `${item.headline} ${item.sourcePublication} ${item.state ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Source Library</h1>
          <p className="mt-1 text-sm text-muted">
            Every story Xonorate Intelligence has discovered. &quot;Unused&quot; is the editorial
            backlog — sources found but not yet turned into content.
          </p>
        </div>
        <Link href="/admin/intelligence" className="text-sm text-brand underline">
          ← Back to Intelligence
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2">
          {USED_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/admin/intelligence/sources" : `/admin/intelligence/sources?used=${tab.key}`}
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
        <form method="get" className="flex gap-2">
          {activeTab !== "all" && <input type="hidden" name="used" value={activeTab} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search headline, publication, state…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No sources match.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Headline</th>
              <th className="py-2 font-medium">Publication</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">State</th>
              <th className="py-2 font-medium">Signal</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Used in</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const usedIn = usedInByItem.get(item.id) ?? [];
              return (
                <tr key={item.id} className="border-b border-border align-top">
                  <td className="max-w-xs py-2 text-foreground">
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      {item.headline}
                    </a>
                  </td>
                  <td className="py-2 text-muted">{item.sourcePublication}</td>
                  <td className="py-2 text-muted">
                    {item.publishedAt ? DATE_FORMAT.format(item.publishedAt) : "—"}
                  </td>
                  <td className="py-2 text-muted">{item.state ?? "—"}</td>
                  <td className="py-2">
                    <Badge tone={EDITORIAL_SIGNAL_TONE[item.editorialSignal]}>
                      {EDITORIAL_SIGNAL_LABEL[item.editorialSignal]}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge>{INTELLIGENCE_STATUS_LABEL[item.status]}</Badge>
                  </td>
                  <td className="py-2 text-muted">{usedIn.length > 0 ? usedIn.join(", ") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
