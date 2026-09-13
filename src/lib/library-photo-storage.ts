import { getStore } from "@netlify/blobs";

const STORE_NAME = "library-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class InvalidLibraryPhotoError extends Error {}

/** Same shape as case-photo-storage.ts's uploadCasePhoto, but for the
 * shared photo library (see libraryPhotos in schema.ts) — kept as a
 * separate Blobs store so library photos and per-case photos don't mix. */
export async function uploadLibraryPhoto(file: File): Promise<string> {
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    throw new InvalidLibraryPhotoError("Photo must be a JPEG, PNG, WebP, or AVIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidLibraryPhotoError("Photo must be smaller than 5MB.");
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  const store = getStore(STORE_NAME);
  await store.set(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type },
  });

  return `/api/library-photos/${key}`;
}

export async function getLibraryPhotoBlob(
  key: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = getStore(STORE_NAME);
  const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!entry) return null;

  const contentType = typeof entry.metadata?.contentType === "string" ? entry.metadata.contentType : "application/octet-stream";
  return { data: entry.data, contentType };
}

export async function deleteLibraryPhotoBlob(key: string): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.delete(key);
}
