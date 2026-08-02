import { getStore } from "@netlify/blobs";

const STORE_NAME = "case-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class InvalidCasePhotoError extends Error {}

/** Uploads an admin-submitted case photo to Netlify Blobs and returns the
 * site-relative path it's served from (see the /api/case-photos route). */
export async function uploadCasePhoto(file: File): Promise<string> {
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    throw new InvalidCasePhotoError(
      "Photo must be a JPEG, PNG, WebP, or AVIF image.",
    );
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidCasePhotoError("Photo must be smaller than 5MB.");
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const store = getStore(STORE_NAME);
  await store.set(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type },
  });

  return `/api/case-photos/${key}`;
}

export async function getCasePhoto(
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
