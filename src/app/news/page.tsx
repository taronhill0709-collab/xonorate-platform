import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/post-excerpt";
import { NEWSROOM_TOPICS, PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "Xonorate's newsroom — investigations, case developments, and policy coverage of wrongful convictions.",
};

// Publishing happens from the admin at any time — never statically prerendered.
export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function NewsroomPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeTopic = NEWSROOM_TOPICS.some((t) => t.value === type) ? type : undefined;

  const allPublished = await db
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

  const rows = activeTopic ? allPublished.filter((p) => p.type === activeTopic) : allPublished;
  const [featured, ...rest] = rows;

  const caseDevelopments = !activeTopic
    ? allPublished.filter((p) => p.type === "case_spotlight" && p.caseId)
    : [];
  const developmentCaseIds = caseDevelopments
    .map((p) => p.caseId)
    .filter((id): id is string => Boolean(id));
  const developmentCases =
    developmentCaseIds.length > 0
      ? await db
          .select({ id: cases.id, clientName: cases.clientName, slug: cases.slug })
          .from(cases)
          .where(inArray(cases.id, developmentCaseIds))
      : [];
  const caseNameById = new Map(developmentCases.map((c) => [c.id, c]));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <p className="text-xs font-semibold tracking-widest text-brand uppercase">
              Xonorate Newsroom
            </p>
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Investigate. Inform. Empower.
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              Original investigations, case developments, and policy coverage
              from Xonorate — not press releases.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <nav className="flex flex-wrap gap-2 border-b border-border pb-6" aria-label="Topics">
            <Link
              href="/news"
              className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${
                !activeTopic
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              All
            </Link>
            {NEWSROOM_TOPICS.map((topic) => (
              <Link
                key={topic.value}
                href={`/news?type=${topic.value}`}
                className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${
                  activeTopic === topic.value
                    ? "bg-brand text-brand-foreground"
                    : "border border-border text-muted hover:text-foreground"
                }`}
              >
                {topic.label}
              </Link>
            ))}
          </nav>

          {rows.length === 0 ? (
            <p className="mt-12 border border-dashed border-border p-8 text-center text-sm text-muted">
              {activeTopic
                ? "No stories in this topic yet. Check back soon."
                : "No investigations published yet. Check back soon."}
            </p>
          ) : (
            <>
              {featured && (
                <section className="mt-10">
                  <p className="text-xs font-bold tracking-widest text-brand uppercase">
                    Featured investigation
                  </p>
                  <Link href={`/news/${featured.slug}`} className="group mt-4 grid gap-6 sm:grid-cols-2">
                    <div className="relative aspect-video w-full overflow-hidden border border-header-border sm:aspect-auto">
                      {featured.imageUrl ? (
                        <Image
                          src={featured.imageUrl}
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
                        {PUBLIC_POST_TYPE_LABEL[featured.type] ?? featured.type}
                        {" · "}
                        {DATE_FORMAT.format(featured.publishedAt ?? featured.createdAt)}
                      </p>
                      <h2 className="mt-2 font-serif text-3xl text-foreground">
                        {featured.title}
                      </h2>
                      <p className="mt-3 text-muted">{excerptFromMarkdown(featured.body, 220)}</p>
                      <span className="mt-4 text-sm font-bold text-brand uppercase">
                        Read the story →
                      </span>
                    </div>
                  </Link>
                </section>
              )}

              {rest.length > 0 && (
                <section className="mt-14 border-t border-border pt-10">
                  <p className="text-xs font-bold tracking-widest text-brand uppercase">Latest</p>
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post) => (
                      <Link
                        key={post.id}
                        href={`/news/${post.slug}`}
                        className="group flex flex-col border border-header-border"
                      >
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
                          <p className="line-clamp-2 flex-1 text-sm text-muted">
                            {excerptFromMarkdown(post.body)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {caseDevelopments.length > 0 && (
                <section className="mt-14 border-t border-border pt-10">
                  <p className="text-xs font-bold tracking-widest text-brand uppercase">
                    Case developments
                  </p>
                  <div className="mt-6 divide-y divide-border border-t border-b border-border">
                    {caseDevelopments.map((post) => {
                      const relatedCase = post.caseId ? caseNameById.get(post.caseId) : null;
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
                            <span className="font-serif text-lg text-foreground">
                              {post.title}
                            </span>
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
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
