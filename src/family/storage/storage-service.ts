// The application-level storage interface, per the approved architecture
// plan (item 37): Family document code depends on this, never on
// @netlify/blobs directly, so the provider can be swapped later without
// touching src/family/documents.ts or any route.
//
// No getSignedUrl(): every document read goes through an authenticated
// Next.js route (see /family/[familyId]/documents/[documentId]/download)
// that re-checks family membership on every request, rather than handing
// out a direct-to-storage URL. That's a deliberate Phase 1 choice — a
// signed URL is one more thing that could leak or outlive its intended
// scope, and the proxy-download pattern means every byte served is
// authorized at request time. Add getSignedUrl() to this interface (and
// both call sites) if a future need for direct-from-storage delivery
// (e.g. large-file streaming, a CDN in front of documents) outweighs that.
export type StoredFile = {
  data: ArrayBuffer;
  contentType: string;
};

export interface StorageService {
  upload(key: string, data: ArrayBuffer, options: { contentType: string }): Promise<void>;
  download(key: string): Promise<StoredFile | null>;
  delete(key: string): Promise<void>;
}
