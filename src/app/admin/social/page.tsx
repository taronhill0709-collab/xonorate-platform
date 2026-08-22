import { asc, desc, eq } from "drizzle-orm";
import Image from "next/image";
import { cookies } from "next/headers";
import { CopyCaptionButton } from "./copy-caption-button";
import { PostToSocialButton } from "./post-to-social-button";
import { RefreshMetricsButton } from "./refresh-metrics-button";
import { setSocialPostsEnabled } from "./actions";
import { SOCIAL_POSTS_COOKIE } from "./constants";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { buildSocialCaption } from "@/lib/social-caption";
import { SPOTLIGHT_CASE_LABEL } from "@/lib/case-status";

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
            Ready-to-share captions for Facebook and Instagram, built from your exonerated
            cases. Save the photo, copy the caption, post.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <RefreshMetricsButton />
          {toggle}
        </div>
      </div>

      {!enabled ? (
        <p className="mt-6 text-sm text-muted">
          Social post prep is turned off. Turn it on above whenever you want to
          pull captions for your latest exonerations.
        </p>
      ) : (
        <SocialCaseList limit={LIMIT} />
      )}
    </div>
  );
}

type ExonerationDetails = { whatLedToExoneration: string; year: number } | null;

async function SocialCaseList({ limit }: { limit: number }) {
  const [rows, origin] = await Promise.all([
    db
      .select()
      .from(cases)
      .where(eq(cases.status, "exonerated"))
      .orderBy(asc(cases.sortOrder), desc(cases.updatedAt))
      .limit(limit),
    getOrigin(),
  ]);

  return rows.length === 0 ? (
    <p className="mt-6 text-sm text-muted">No exonerated cases yet.</p>
  ) : (
    <div className="mt-6 space-y-6">
      {rows.map((row) => {
        const exoneration = row.exonerationDetails as ExonerationDetails;
        const excerpt = exoneration?.whatLedToExoneration || row.summary;
        const caption = buildSocialCaption({
          clientName: row.clientName,
          state: row.state,
          excerpt,
          origin,
          slug: row.slug,
        });

        return (
          <div
            key={row.id}
            className="flex gap-5 rounded-lg border border-border p-5"
          >
            {row.photoUrl ? (
              <a
                href={row.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Image
                  src={row.photoUrl}
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
                {row.state}
                {!row.isClient && ` · ${SPOTLIGHT_CASE_LABEL}`}
                {exoneration?.year && ` · Exonerated ${exoneration.year}`}
              </p>
              <p className="mt-1 font-serif text-lg text-foreground">
                {row.clientName}
              </p>

              <textarea
                readOnly
                value={caption}
                rows={6}
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <CopyCaptionButton text={caption} />
                {row.photoUrl && (
                  <a
                    href={row.photoUrl}
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
                  caseId={row.id}
                  alreadyPostedAt={row.postedToSocialAt?.toISOString() ?? null}
                  disabledReason={row.photoUrl ? undefined : "No photo — can't post to Instagram"}
                />
                {row.bufferPostId && (
                  <p className="mt-2 text-xs text-muted">
                    {row.socialViews.toLocaleString()} view
                    {row.socialViews === 1 ? "" : "s"} on Instagram
                    {row.socialMetricsSyncedAt &&
                      ` · synced ${row.socialMetricsSyncedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
