import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import { CopyCaptionButton } from "./copy-caption-button";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { buildSocialCaption } from "@/lib/social-caption";
import { POST_TYPE_LABEL } from "@/lib/post-type";

const LIMIT = 14;

export default async function AdminSocialPage() {
  const [rows, origin] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(LIMIT),
    getOrigin(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Social posts</h1>
      <p className="mt-1 text-sm text-muted">
        Ready-to-share captions for Facebook and Instagram, built from your
        published updates. Save the photo, copy the caption, post.
      </p>

      {rows.length === 0 ? (
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
                  <div className="mt-2 flex items-center gap-3">
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
