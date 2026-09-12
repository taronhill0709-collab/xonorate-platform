import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comment-section";
import { MarkdownBody } from "@/components/markdown-body";
import { ShareButtons } from "@/components/share-buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, petitions, posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/post-excerpt";
import { PUBLIC_POST_TYPE_LABEL } from "@/lib/post-type";
import { getOrigin, resolveShareImage } from "@/lib/request-ip";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select({ title: posts.title, body: posts.body, imageUrl: posts.imageUrl, status: posts.status })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!post || post.status !== "published") return { title: "Story not found" };

  const description = excerptFromMarkdown(post.body);
  const origin = await getOrigin();
  const url = `${origin}/news/${slug}`;
  const shareImage = resolveShareImage(post.imageUrl, origin, `${origin}/opengraph-image`);

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description, url, type: "article", images: [shareImage] },
    twitter: { card: "summary_large_image", title: post.title, description, images: [shareImage] },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  if (!post || post.status !== "published") notFound();

  const sources = (post.sources as { url: string; title: string }[] | null) ?? [];
  const origin = await getOrigin();

  const relatedCase = post.caseId
    ? (
        await db
          .select({ id: cases.id, clientName: cases.clientName, slug: cases.slug, summary: cases.summary })
          .from(cases)
          .where(eq(cases.id, post.caseId))
          .limit(1)
      )[0]
    : null;

  const relatedPetition = relatedCase
    ? (
        await db
          .select({ title: petitions.title, slug: petitions.slug })
          .from(petitions)
          .where(and(eq(petitions.caseId, relatedCase.id), eq(petitions.status, "published")))
          .orderBy(desc(petitions.createdAt))
          .limit(1)
      )[0]
    : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">
              {PUBLIC_POST_TYPE_LABEL[post.type] ?? post.type}
              {" · "}
              {DATE_FORMAT.format(post.publishedAt ?? post.createdAt)}
            </p>
            <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-5xl">
              {post.title}
            </h1>
          </div>
        </div>

        {post.imageUrl && (
          <div className="relative aspect-video w-full max-h-[520px] overflow-hidden border-b border-header-border">
            <Image src={post.imageUrl} alt="" fill sizes="100vw" className="object-cover" unoptimized />
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          <MarkdownBody>{post.body}</MarkdownBody>

          {sources.length > 0 && (
            <section className="mt-10 border-t border-border pt-6">
              <p className="text-xs font-bold tracking-widest text-label uppercase">Sources</p>
              <ul className="mt-3 space-y-1.5">
                {sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-link hover:text-link-strong hover:underline"
                    >
                      {source.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {relatedCase && (
            <section className="mt-10 border border-border bg-muted-background p-6">
              <p className="text-xs font-bold tracking-widest text-brand uppercase">
                Related case
              </p>
              <p className="mt-2 font-serif text-2xl text-foreground">
                {relatedCase.clientName}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{relatedCase.summary}</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  href={`/cases/${relatedCase.slug}`}
                  className="bg-brand px-5 py-2 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
                >
                  View case →
                </Link>
                {relatedPetition && (
                  <Link
                    href={`/petitions/${relatedPetition.slug}`}
                    className="border border-border px-5 py-2 text-xs font-bold tracking-widest text-foreground uppercase transition hover:border-brand"
                  >
                    Sign the petition
                  </Link>
                )}
              </div>
            </section>
          )}

          <div className="mt-10">
            <ShareButtons url={`${origin}/news/${slug}`} title={post.title} />
          </div>

          <CommentSection targetType="post" targetId={post.id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
