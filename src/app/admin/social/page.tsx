import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import { cookies } from "next/headers";
import { CopyCaptionButton } from "./copy-caption-button";
import { PostToSocialButton } from "./post-to-social-button";
import { setSocialPostsEnabled } from "./actions";
import { SOCIAL_POSTS_COOKIE } from "./constants";
import { ShareButtons } from "@/components/share-buttons";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { buildSocialCaption } from "@/lib/social-caption";
import { POST_TYPE_LABEL } from "@/lib/post-type";

const LIMIT = 14;

export default async function AdminSocialPage() {
  const cookieStore = await cookies();
  const enabled = cookieStore.get(SOCIAL_POSTS_COOKIE)?.value === "1";

  const toggle = (
    <form action={setSocialPostsEnabled.bind(null, !enabled)}>
      <button
        type="submit"
        className={
          enabled
            ? "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted-background"
            : "rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition hover:opacity-90"
        }
      >
        {enabled ? "Turn off" : "Turn on"}
      </button>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Social posts</h1>
          <p className="mt-1 text-sm text-muted">
            Ready-to-share captions for Facebook and Instagram, built from your
            published updates. Save the photo, copy the caption, post.
          </p>
        </div>
        {toggle}
      </div>

      {!enabled ? (
        <p className="mt-6 text-sm text-muted">
          Social post prep is turned off. Turn it on above whenever you want to
          pull captions for today&apos;s updates.
        </p>
      ) : (
        <SocialPostList limit={LIMIT} />
      )}
    </div>
  );
}

async function SocialPostList({ limit }: { limit: number }) {
  const [rows, origin] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit),
    getOrigin(),
  ]);

  return rows.length === 0 ? (
    <p className="mt-6 text-sm text-muted">No published updates yet.</p>
  ) : (
    <div className="mt-6 space-y-6">
      {rows.map((row) => {
        const caption = buildSocialCaption({
          title: row.title,
          body: row.body,
          origin,
          slug: row.slug,
        });

        return (
          <div
            key={row.id}
            className="flex gap-5 rounded-lg border border-border p-5"
          >
            {row.imageUrl ? (
              <a
                href={row.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Image
                  src={row.imageUrl}
                  alt=""
                  width={160}
                  height={120}
                  className="h-[120px] w-40 rounded-md object-cover"
                  unoptimized
                />
              </a>
            ) : (
              <div className="flex h-[120px] w-40 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-center text-xs text-muted">
                No photo
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-brand">
                {POST_TYPE_LABEL[row.type] ?? row.type}
                {row.publishedAt &&
                  ` · ${row.publishedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}`}
              </p>
              <p className="mt-1 font-serif text-lg text-foreground">
                {row.title}
              </p>

              <textarea
                readOnly
                value={caption}
                rows={6}
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <CopyCaptionButton text={caption} />
                {row.imageUrl && (
                  <a
                    href={row.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand underline"
                  >
                    Open photo to save
                  </a>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs text-muted">
                  Post directly through Buffer, or share manually:
                </p>
                <PostToSocialButton
                  postId={row.id}
                  alreadyPostedAt={row.postedToSocialAt?.toISOString() ?? null}
                  disabledReason={row.imageUrl ? undefined : "No photo — can't post to Instagram"}
                />
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs text-muted">
                  Share the article link directly (Facebook/X show their own
                  preview card — Instagram doesn&apos;t support link-sharing, so
                  use the copied caption + saved photo there instead):
                </p>
                <ShareButtons
                  url={`${origin}/posts/${row.slug}`}
                  title={row.title}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
