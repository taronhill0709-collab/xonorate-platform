// Swapping storage providers later means changing this one line, not any
// call site in src/family/documents.ts or its routes.
export { netlifyBlobsStorageService as storageService } from "./netlify-blobs-provider";
export type { StorageService, StoredFile } from "./storage-service";
