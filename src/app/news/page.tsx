import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, investigations, postCaseLinks, posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/post-excerpt";
import { NEWSROOM_TOPICS, PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";

export const metadata: Metadata = {
  title: "Xonorate Investigates",
  description:
    "Xonorate Investigates — original investigations, analysis, and case developments behind the headlines on wrongful convictions.",
};

// Publishing happens from the admin at any time — never statically prerendered.
export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type PublishedPost = {
  id: string;
  type: string;
  title: string;
  slug: string;
  body: string;
  imageUrl: string | null;
  state: string | null;
  caseId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

function TypeCard({ post }: { post: PublishedPost }) {
  return (
    <Link href={`/news/${post.slug}`} className="group flex flex-col border border-header-border">
      <div className="relative aspect-video w-full overflow-hidden">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-muted-background" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-muted-background px-4 py-3">
        <p className="font-mono text-xs font-bold tracking-wide text-label uppercase">
          {PUBLIC_POST_TYPE_LABEL[post.type] ?? post.type}
          {" · "}
          {DATE_FORMAT.format(post.publishedAt ?? post.createdAt)}
        </p>
        <p className="font-serif text-lg text-foreground">{post.title}</p>
        <p className="line-clamp-2 flex-1 text-sm text-muted">{excerptFromMarkdown(post.body)}</p>
      </div>
    </Link>
  );
}

export default async function InvestigatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeTopic = NEWSROOM_TOPICS.some((t) => t.value === type) ? type : undefined;

  // "Investigations" is its own entity/table, not a post type — a
  // completely separate branch rather than folding it into the posts query.
  if (activeTopic === "investigations") {
    const publishedInvestigations = await db
      .select({
        id: investigations.id,
        title: investigations.title,
        slug: investigations.slug,
        subtitle: investigations.subtitle,
        summary: investigations.summary,
        heroImageUrl: investigations.heroImageUrl,
        publishedAt: investigations.publishedAt,
      })
      .from(investigations)
      .where(eq(investigations.status, "published"))
      .orderBy(desc(investigations.publishedAt));

    return (
      <>
        <SiteHeader />
        <main id="main-content" className="flex-1 bg-background">
          <InvestigatesHero />
          <div className="mx-auto w-full max-w-6xl px-6 py-10">
            <TopicNav active="investigations" />
            {publishedInvestigations.length === 0 ? (
              <p className="mt-12 border border-dashed border-border p-8 text-center text-sm text-muted">
                No investigations published yet. Check back soon.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {publishedInvestigations.map((inv) => (
                  <Link key={inv.id} href={`/investigations/${inv.slug}`} className="group flex flex-col">
                    <div className="relative aspect-video w-full overflow-hidden border border-header-border">
                      {inv.heroImageUrl ? (
                        <Image
                          src={inv.heroImageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted-background" />
                      )}
                    </div>
                    <p className="mt-4 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                      Investigation
                      {inv.publishedAt && ` · ${DATE_FORMAT.format(inv.publishedAt)}`}
                    </p>
                    <p className="mt-2 font-serif text-2xl text-foreground">{inv.title}</p>
                    <p className="mt-2 text-sm text-muted">{inv.subtitle ?? inv.summary}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const allPublished: PublishedPost[] = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      imageUrl: posts.imageUrl,
      state: posts.state,
      caseId: posts.caseId,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.sortOrder), desc(posts.createdAt));

  // case_development posts connect to a case via postCaseLinks (many-to-many),
  // not the legacy posts.caseId single FK that case_spotlight uses — both
  // count as a "case development" for this page.
  const caseDevPostIds = allPublished.filter((p) => p.type === "case_development").map((p) => p.id);
  const caseDevLinks =
    caseDevPostIds.length > 0
      ? await db
          .select({ postId: postCaseLinks.postId, caseId: postCaseLinks.caseId })
          .from(postCaseLinks)
          .where(inArray(postCaseLinks.postId, caseDevPostIds))
      : [];
  const caseIdByPostId = new Map<string, string>();
  for (const post of allPublished) {
    if (post.type === "case_spotlight" && post.caseId) caseIdByPostId.set(post.id, post.caseId);
  }
  for (const link of caseDevLinks) {
    if (!caseIdByPostId.has(link.postId)) caseIdByPostId.set(link.postId, link.caseId);
  }

  if (activeTopic) {
    const rows = allPublished.filter((p) =>
      activeTopic === "case_development"
        ? p.type === "case_development" || (p.type === "case_spotlight" && p.caseId)
        : p.type === activeTopic,
    );

    return (
      <>
        <SiteHeader />
        <main id="main-content" className="flex-1 bg-background">
          <InvestigatesHero />
          <div className="mx-auto w-full max-w-6xl px-6 py-10">
            <TopicNav active={activeTopic} />
            {rows.length === 0 ? (
              <p className="mt-12 border border-dashed border-border p-8 text-center text-sm text-muted">
                No stories in this topic yet. Check back soon.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((post) => (
                  <TypeCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // --- "All" view: the full hierarchy — Featured Investigation, Xonorate
  // Analysis, Case Developments, Latest. ---

  const [featuredInvestigation] = await db
    .select({
      id: investigations.id,
      title: investigations.title,
      slug: investigations.slug,
      subtitle: investigations.subtitle,
      summary: investigations.summary,
      heroImageUrl: investigations.heroImageUrl,
      publishedAt: investigations.publishedAt,
    })
    .from(investigations)
    .where(eq(investigations.status, "published"))
    .orderBy(desc(investigations.publishedAt))
    .limit(1);

  const analysisRows = allPublished.filter((p) => p.type === "analysis").slice(0, 4);

  const caseDevelopmentRows = allPublished
    .filter((p) => p.type === "case_development" || (p.type === "case_spotlight" && p.caseId))
    .slice(0, 5);
  const relatedCaseIds = [...new Set(caseDevelopmentRows.map((p) => caseIdByPostId.get(p.id)).filter((id): id is string => Boolean(id)))];
  const relatedCases =
    relatedCaseIds.length > 0
      ? await db.select({ id: cases.id, clientName: cases.clientName, slug: cases.slug }).from(cases).where(inArray(cases.id, relatedCaseIds))
      : [];
  const caseById = new Map(relatedCases.map((c) => [c.id, c]));

  const shownIds = new Set([...analysisRows.map((p) => p.id), ...caseDevelopmentRows.map((p) => p.id)]);
  const latestRows = allPublished.filter((p) => !shownIds.has(p.id)).slice(0, 6);

  const nothingToShow = !featuredInvestigation && allPublished.length === 0;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <InvestigatesHero />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <TopicNav active={undefined} />

          {nothingToShow ? (
            <p className="mt-12 border border-dashed border-border p-8 text-center text-sm text-muted">
              No investigations published yet. Check back soon.
            </p>
          ) : (
            <>
              {featuredInvestigation && (
                <section className="mt-10">
                  <Eyebrow text="Featured investigation" />
                  <Link
                    href={`/investigations/${featuredInvestigation.slug}`}
                    className="group mt-4 grid gap-6 sm:grid-cols-2"
                  >
                    <div className="relative aspect-video w-full overflow-hidden border border-header-border sm:aspect-auto">
                      {featuredInvestigation.heroImageUrl ? (
                        <Image
                          src={featuredInvestigation.heroImageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted-background" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="font-mono text-xs font-bold tracking-wide text-brand uppercase">
                        Xonorate Investigation
                        {featuredInvestigation.publishedAt && ` · ${DATE_FORMAT.format(featuredInvestigation.publishedAt)}`}
                      </p>
                      <h2 className="mt-2 font-serif text-3xl text-foreground">{featuredInvestigation.title}</h2>
                      <p className="mt-3 text-muted">
                        {featuredInvestigation.subtitle ?? excerptFromMarkdown(featuredInvestigation.summary, 220)}
                      </p>
                      <span className="mt-4 text-sm font-bold text-brand uppercase">Read the investigation →</span>
                    </div>
                  </Link>
                </section>
              )}

              {analysisRows.length > 0 && (
                <section className="mt-14 border-t border-border pt-10">
                  <Eyebrow text="Xonorate analysis" />
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {analysisRows.map((post) => (
                      <Link key={post.id} href={`/news/${post.slug}`} className="group block">
                        <div className="relative aspect-video w-full overflow-hidden border border-header-border">
                          {post.imageUrl ? (
                            <Image
                              src={post.imageUrl}
                              alt=""
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-muted-background" />
                          )}
                        </div>
                        <p className="mt-3 font-mono text-xs font-bold tracking-wide text-label uppercase">
                          Analysis · {DATE_FORMAT.format(post.publishedAt ?? post.createdAt)}
                        </p>
                        <p className="mt-1 font-serif text-xl text-foreground">{post.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{excerptFromMarkdown(post.body)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {caseDevelopmentRows.length > 0 && (
                <section className="mt-14 border-t border-border pt-10">
                  <Eyebrow text="Case developments" />
                  <div className="mt-6 divide-y divide-border border-t border-b border-border">
                    {caseDevelopmentRows.map((post) => {
                      const caseId = caseIdByPostId.get(post.id);
                      const relatedCase = caseId ? caseById.get(caseId) : null;
                      return (
                        <Link
                          key={post.id}
                          href={`/news/${post.slug}`}
                          className="flex flex-wrap items-baseline justify-between gap-2 py-4 transition hover:bg-muted-background"
                        >
                          <span>
                            <span className="font-mono text-xs font-bold tracking-wide text-brand uppercase">
                              {DATE_FORMAT.format(post.publishedAt ?? post.createdAt)}
                            </span>{" "}
                            <span className="font-serif text-lg text-foreground">{post.title}</span>
                          </span>
                          {relatedCase && (
                            <span className="text-xs font-bold tracking-wide text-muted uppercase">
                              {relatedCase.clientName}&apos;s case →
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {latestRows.length > 0 && (
                <section className="mt-14 border-t border-border pt-10">
                  <Eyebrow text="Latest" />
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {latestRows.map((post) => (
                      <TypeCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function InvestigatesHero() {
  return (
    <div className="border-b border-header-border bg-header-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <Eyebrow text="Xonorate Investigates" />
        <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">Beyond the headline.</h1>
        <p className="mt-2 max-w-xl text-header-muted">
          Automation discovers what&apos;s happening. Xonorate decides what matters, investigates
          what deserves deeper attention, and connects it back to the people living it.
        </p>
      </div>
    </div>
  );
}

function TopicNav({ active }: { active: string | undefined }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-6" aria-label="Topics">
      <Link
        href="/news"
        className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${
          !active ? "bg-brand text-brand-foreground" : "border border-border text-muted hover:text-foreground"
        }`}
      >
        All
      </Link>
      {NEWSROOM_TOPICS.map((topic) => (
        <Link
          key={topic.value}
          href={`/news?type=${topic.value}`}
          className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${
            active === topic.value ? "bg-brand text-brand-foreground" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          {topic.label}
        </Link>
      ))}
    </nav>
  );
}
