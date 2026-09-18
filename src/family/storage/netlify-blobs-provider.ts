import { getStore } from "@netlify/blobs";
import type { StorageService, StoredFile } from "./storage-service";

// Own store, separate from case-photos/library-photos/etc. — family
// documents are private by construction (no /api/*-photos-style public
// serving route exists for this store), unlike those, which are meant to
// be publicly reachable.
const STORE_NAME = "family-documents";

export const netlifyBlobsStorageService: StorageService = {
  async upload(key, data, options) {
    const store = getStore(STORE_NAME);
    await store.set(key, data, { metadata: { contentType: options.contentType } });
  },

  async download(key): Promise<StoredFile | null> {
    const store = getStore(STORE_NAME);
    const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!entry) return null;
    const contentType =
      typeof entry.metadata?.contentType === "string"
        ? entry.metadata.contentType
        : "application/octet-stream";
    return { data: entry.data, contentType };
  },

  async delete(key) {
    const store = getStore(STORE_NAME);
    await store.delete(key);
  },
};
