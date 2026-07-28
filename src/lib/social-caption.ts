import { excerptFromMarkdown } from "@/lib/markdown";

const HASHTAGS = "#WrongfulConviction #Justice #Exoneration #Innocence";

/** Ready-to-paste Facebook/Instagram caption for a published post — a self-contained
 * summary first, since links get buried by social algorithms, with the link kept
 * at the end for anyone who wants to read further. */
export function buildSocialCaption({
  title,
  body,
  origin,
  slug,
}: {
  title: string;
  body: string;
  origin: string;
  slug: string;
}): string {
  const excerpt = excerptFromMarkdown(body, 280);
  return [
    title,
    "",
    excerpt,
    "",
    `Full story: ${origin}/posts/${slug}`,
    "",
    HASHTAGS,
  ].join("\n");
}
