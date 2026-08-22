const HASHTAGS = "#WrongfulConviction #Justice #Exoneration #Innocence";

// Instagram/Facebook captions read better as a self-contained summary first
// (links get buried by social algorithms), with the link kept at the end
// for anyone who wants to read further.
const EXCERPT_LIMIT = 280;

/** Ready-to-paste Facebook/Instagram caption for an exonerated case. */
export function buildSocialCaption({
  clientName,
  state,
  excerpt,
  origin,
  slug,
}: {
  clientName: string;
  state: string;
  excerpt: string;
  origin: string;
  slug: string;
}): string {
  const trimmed =
    excerpt.length > EXCERPT_LIMIT ? `${excerpt.slice(0, EXCERPT_LIMIT - 1)}…` : excerpt;
  return [
    `${clientName} (${state}) was wrongfully convicted — and has now been exonerated.`,
    "",
    trimmed,
    "",
    `Full story: ${origin}/cases/${slug}`,
    "",
    HASHTAGS,
  ].join("\n");
}
