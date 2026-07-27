import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CommentSection } from "@/components/comment-section";
import { ShareButtons } from "@/components/share-buttons";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases, posts } from "@/db/schema";
import { excerptFromMarkdown } from "@/lib/markdown";
import { POST_TYPE_LABEL } from "@/lib/post-type";
import { getOrigin } from "@/lib/request-ip";

// New posts publish throughout the day — never statically prerendered.
export const dynamic = "force-dynamic";

// react-markdown injects a `node` prop (the mdast/hast AST node) into every
// component override — it must be stripped, not spread, or it leaks onto the
// DOM element as a literal `node="[object Object]"` attribute.
type WithNode<T> = T & { node?: unknown };

function omitNode<T extends object>(props: WithNode<T>): T {
  const rest = { ...props };
  delete (rest as { node?: unknown }).node;
  return rest as T;
}

const markdownComponents = {
  h1: (props: WithNode<React.ComponentProps<"h1">>) => (
    <h2 className="mt-8 mb-2 font-serif text-xl text-foreground" {...omitNode(props)} />
  ),
  h2: (props: WithNode<React.ComponentProps<"h2">>) => (
    <h2 className="mt-8 mb-2 font-serif text-xl text-foreground" {...omitNode(props)} />
  ),
  h3: (props: WithNode<React.ComponentProps<"h3">>) => (
    <h3 className="mt-6 mb-2 font-serif text-lg text-foreground" {...omitNode(props)} />
  ),
  p: (props: WithNode<React.ComponentProps<"p">>) => (
    <p className="mt-4 leading-relaxed text-foreground" {...omitNode(props)} />
  ),
  a: (props: WithNode<React.ComponentProps<"a">>) => (
    <a
      className="text-brand underline"
      target="_blank"
      rel="noopener noreferrer"
      {...omitNode(props)}
    />
  ),
  strong: (props: WithNode<React.ComponentProps<"strong">>) => (
    <strong className="font-semibold text-foreground" {...omitNode(props)} />
  ),
  ul: (props: WithNode<React.ComponentProps<"ul">>) => (
    <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground" {...omitNode(props)} />
  ),
  ol: (props: WithNode<React.ComponentProps<"ol">>) => (
    <ol className="mt-4 list-decimal space-y-1 pl-6 text-foreground" {...omitNode(props)} />
  ),
  li: (props: WithNode<React.ComponentProps<"li">>) => (
    <li className="leading-relaxed" {...omitNode(props)} />
  ),
  hr: () => <hr className="my-8 border-border" />,
  blockquote: (props: WithNode<React.ComponentProps<"blockquote">>) => (
    <blockquote
      className="mt-4 border-l-2 border-border pl-4 italic text-muted"
      {...omitNode(props)}
    />
  ),
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select({
      title: posts.title,
      body: posts.body,
      publishedAt: posts.publishedAt,
      casePhotoUrl: cases.photoUrl,
    })
    .from(posts)
    .leftJoin(cases, eq(posts.caseId, cases.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!post) return { title: "Update not found" };

  const description = excerptFromMarkdown(post.body);
  const origin = await getOrigin();
  const url = `${origin}/posts/${slug}`;
  const shareImage = post.casePhotoUrl ?? `${origin}/opengraph-image`;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [shareImage],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);
  if (!post) notFound();

  const linkedCase = post.caseId
    ? (
        await db
          .select({ clientName: cases.clientName, slug: cases.slug })
          .from(cases)
          .where(eq(cases.id, post.caseId))
          .limit(1)
      )[0]
    : null;

  const sources = post.sources as { url: string; title: string }[];
  const origin = await getOrigin();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          {POST_TYPE_LABEL[post.type] ?? post.type}
          {post.publishedAt && (
            <>
              {" · "}
              {post.publishedAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </>
          )}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">{post.title}</h1>

        {linkedCase && (
          <p className="mt-2 text-sm text-muted">
            About:{" "}
            <Link href={`/cases/${linkedCase.slug}`} className="text-brand underline">
              {linkedCase.clientName}
            </Link>
          </p>
        )}

        <article>
          <ReactMarkdown components={markdownComponents}>{post.body}</ReactMarkdown>
        </article>

        {sources.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-lg text-foreground">Sources</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    className="text-brand underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10">
          <ShareButtons url={`${origin}/posts/${slug}`} title={post.title} />
        </div>

        <CommentSection targetType="post" targetId={post.id} />
      </main>
    </>
  );
}
