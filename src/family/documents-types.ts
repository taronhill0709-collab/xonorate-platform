// Client-safe: imports only from @/db/schema (no db/pg connection at module
// scope), so a "use client" form can import this without pulling `pg` into
// the browser bundle. See docs/ARCHITECTURE.md's "Keep client-safe
// constants out of DB-touching files" note (the same split calendar-types.ts
// exists for) — never import these from documents.ts's callers client-side.
import { familyDocumentCategoryEnum } from "@/db/schema";

export type DocumentCategory = (typeof familyDocumentCategoryEnum.enumValues)[number];

/** Human-language labels for the UI — never show the raw db enum value to a user. */
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  court: "Court",
  sentencing: "Sentencing",
  appeals: "Appeals",
  prison: "Prison",
  parole: "Parole",
  clemency: "Clemency",
  medical: "Medical",
  education: "Education",
  employment: "Employment",
  identification: "Identification",
  reentry: "Reentry",
  letters: "Letters",
  other: "Other",
};

export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
