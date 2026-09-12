import { getStore } from "@netlify/blobs";

const STORE_NAME = "case-video-thumbnails";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class InvalidCaseVideoThumbnailError extends Error {}

/** Uploads an admin-submitted video poster/thumbnail to Netlify Blobs and
 * returns the site-relative path it's served from (see the
 * /api/case-video-thumbnails route). Mirrors case-photo-storage.ts. */
export async function uploadCaseVideoThumbnail(file: File): Promise<string> {
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    throw new InvalidCaseVideoThumbnailError(
      "Thumbnail must be a JPEG, PNG, WebP, or AVIF image.",
    );
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidCaseVideoThumbnailError("Thumbnail must be smaller than 5MB.");
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const store = getStore(STORE_NAME);
  await store.set(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type },
  });

  return `/api/case-video-thumbnails/${key}`;
}

export async function getCaseVideoThumbnail(
  key: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = getStore(STORE_NAME);
  const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!entry) return null;

  const contentType =
    typeof entry.metadata?.contentType === "string"
      ? entry.metadata.contentType
      : "application/octet-stream";
  return { data: entry.data, contentType };
}
