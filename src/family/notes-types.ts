// Client-safe: imports only from @/db/schema (no db/pg connection at module
// scope) — see docs/ARCHITECTURE.md's "Keep client-safe constants out of
// DB-touching files" note. A "use client" note form imports this, never
// notes.ts directly.
import { familyNoteVisibilityEnum } from "@/db/schema";

export type NoteVisibility = (typeof familyNoteVisibilityEnum.enumValues)[number];

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  private: "Private — only me",
  family: "Family — everyone in this family",
};
