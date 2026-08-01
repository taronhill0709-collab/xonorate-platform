const BUFFER_API_URL = "https://api.buffer.com";

// Instagram rejects/truncates captions past this length.
const INSTAGRAM_CAPTION_LIMIT = 2200;

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

type CreatePostResponse = {
  createPost: { post: { id: string } } | { message: string };
};

export type PostToInstagramResult =
  | { ok: true; bufferPostId: string }
  | { ok: false; error: string };

/**
 * Publishes immediately to Xonorate's connected Instagram channel. Buffer's
 * own account-level channel linking cross-posts this to the Facebook Page
 * automatically (configured in Buffer directly, not via this API) — this
 * must only ever target the Instagram channel. Calling it a second time, or
 * adding a separate Facebook channel call, would double-post to Facebook.
 */
export async function postToInstagram({
  text,
  imageUrl,
}: {
  text: string;
  imageUrl: string;
}): Promise<PostToInstagramResult> {
  const apiKey = process.env.BUFFER_API_KEY;
  const channelId = process.env.BUFFER_INSTAGRAM_CHANNEL_ID;
  if (!apiKey || !channelId) {
    return {
      ok: false,
      error: "Buffer is not configured (missing BUFFER_API_KEY or BUFFER_INSTAGRAM_CHANNEL_ID)",
    };
  }

  const caption =
    text.length > INSTAGRAM_CAPTION_LIMIT
      ? `${text.slice(0, INSTAGRAM_CAPTION_LIMIT - 1)}…`
      : text;

  let res: Response;
  try {
    res = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: CREATE_POST_MUTATION,
        variables: {
          input: {
            text: caption,
            channelId,
            mode: "shareNow",
            schedulingType: "automatic",
            needsApproval: false,
            source: "xonorate-platform",
            assets: [{ image: { url: imageUrl } }],
            metadata: {
              instagram: { type: "post", shouldShareToFeed: true },
            },
          },
        },
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Failed to reach Buffer: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    return { ok: false, error: `Buffer returned HTTP ${res.status}` };
  }

  const json = await res.json();
  if (json.errors?.length) {
    return {
      ok: false,
      error: json.errors.map((e: { message: string }) => e.message).join("; "),
    };
  }

  const result = (json.data as CreatePostResponse).createPost;
  if ("message" in result) {
    return { ok: false, error: result.message };
  }
  return { ok: true, bufferPostId: result.post.id };
}

const GET_POST_METRICS_QUERY = `
  query GetPostMetrics($id: PostId!) {
    post(input: { id: $id }) {
      id
      metrics {
        type
        name
        value
        unit
      }
      metricsUpdatedAt
    }
  }
`;

type PostMetric = { type: string; name: string; value: number; unit: string };
type GetPostMetricsResponse = {
  post: { id: string; metrics: PostMetric[]; metricsUpdatedAt: string | null } | null;
};

export type PostMetricsResult =
  | { ok: true; impressions: number | null; metricsUpdatedAt: string | null }
  | { ok: false; error: string };

/**
 * Fetches Buffer's normalized performance metrics for a single published
 * post. Requires a *personal* Buffer API key — Buffer restricts metrics
 * reads to personal workflows, unlike the team key that's enough to publish.
 * Buffer only refreshes these from the network roughly once a day, so don't
 * call this on every page render — cache the result (see socialViews on the
 * posts table) and refresh it via an explicit admin action instead.
 */
export async function getPostMetrics(bufferPostId: string): Promise<PostMetricsResult> {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Buffer is not configured (missing BUFFER_API_KEY)" };
  }

  let res: Response;
  try {
    res = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_POST_METRICS_QUERY,
        variables: { id: bufferPostId },
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `Failed to reach Buffer: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    return { ok: false, error: `Buffer returned HTTP ${res.status}` };
  }

  const json = await res.json();
  if (json.errors?.length) {
    return {
      ok: false,
      error: json.errors.map((e: { message: string }) => e.message).join("; "),
    };
  }

  const post = (json.data as GetPostMetricsResponse).post;
  if (!post) {
    return { ok: false, error: "Buffer has no record of this post" };
  }

  const impressions = post.metrics.find((m) => m.type === "impressions")?.value ?? null;
  return { ok: true, impressions, metricsUpdatedAt: post.metricsUpdatedAt };
}
