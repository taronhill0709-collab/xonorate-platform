import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/markdown";
import { POST_TYPE_LABEL } from "@/lib/post-type";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Daily advocacy news, case spotlights, and policy coverage from Xonorate Media Platform.",
};

// New posts publish throughout the day — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function PostsIndexPage() {
  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      imageUrl: posts.imageUrl,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Updates</h1>
        <p className="mt-2 text-muted">
          Case spotlights, policy coverage, and daily roundups of wrongful-conviction news.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No updates published yet.</p>
        ) : (
          <ul className="mt-8 space-y-6">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex gap-4 rounded-lg border border-border p-5 shadow-sm transition hover:shadow-md"
              >
                {row.imageUrl && (
                  <div className="relative w-32 shrink-0 self-stretch overflow-hidden rounded-lg ring-1 ring-border/70">
                    <Image
                      src={row.imageUrl}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    {POST_TYPE_LABEL[row.type] ?? row.type}
                    {row.publishedAt && (
                      <>
                        {" · "}
                        {row.publishedAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                  <Link
                    href={`/posts/${row.slug}`}
                    className="mt-1 line-clamp-2 block font-serif text-xl text-foreground hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {excerptFromMarkdown(row.body)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
