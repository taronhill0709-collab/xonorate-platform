import { db } from "@/db";
import { familyDocuments, lovedOnes } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { storageService } from "@/family/storage";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
  type DocumentCategory,
} from "@/family/documents-types";

export class InvalidDocumentError extends Error {}

export async function listFamilyDocuments(
  familyId: string,
  filter?: { lovedOneId?: string },
) {
  const conditions = [eq(familyDocuments.familyId, familyId)];
  if (filter?.lovedOneId) conditions.push(eq(familyDocuments.lovedOneId, filter.lovedOneId));

  return db
    .select({
      id: familyDocuments.id,
      lovedOneId: familyDocuments.lovedOneId,
      lovedOneName: lovedOnes.name,
      category: familyDocuments.category,
      title: familyDocuments.title,
      fileName: familyDocuments.fileName,
      fileSize: familyDocuments.fileSize,
      mimeType: familyDocuments.mimeType,
      tags: familyDocuments.tags,
      createdAt: familyDocuments.createdAt,
    })
    .from(familyDocuments)
    .leftJoin(lovedOnes, eq(familyDocuments.lovedOneId, lovedOnes.id))
    .where(and(...conditions))
    .orderBy(desc(familyDocuments.createdAt));
}

/** Same cross-family guard as loved-ones.ts/calendar.ts: scopes on both documentId and familyId. Pure DB read — no storage call, so this (and updateFamilyDocument below) is testable without live Netlify Blobs credentials. */
export async function getFamilyDocumentForFamily(familyId: string, documentId: string) {
  const [row] = await db
    .select()
    .from(familyDocuments)
    .where(and(eq(familyDocuments.id, documentId), eq(familyDocuments.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function uploadFamilyDocument(params: {
  familyId: string;
  lovedOneId?: string | null;
  uploadedByUserId: string;
  category: DocumentCategory;
  title: string;
  file: File;
  tags?: string[] | null;
}) {
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(params.file.type)) {
    throw new InvalidDocumentError(
      "That file type isn't supported. Please upload a PDF, Word document, plain text file, or image.",
    );
  }
  if (params.file.size > MAX_DOCUMENT_BYTES) {
    throw new InvalidDocumentError("Documents must be smaller than 15MB.");
  }

  // A random key, not derived from familyId/title — authorization is
  // enforced by the DB row lookup (see getFamilyDocumentForFamily) before
  // storage is ever touched, not by the key being hard to guess.
  const storageKey = crypto.randomUUID();
  await storageService.upload(storageKey, await params.file.arrayBuffer(), {
    contentType: params.file.type,
  });

  const [row] = await db
    .insert(familyDocuments)
    .values({
      familyId: params.familyId,
      lovedOneId: params.lovedOneId ?? null,
      uploadedByUserId: params.uploadedByUserId,
      category: params.category,
      title: params.title,
      storageKey,
      fileName: params.file.name,
      fileSize: params.file.size,
      mimeType: params.file.type,
      tags: params.tags ?? null,
    })
    .returning();
  return row;
}

/** Returns null if the document doesn't exist or belongs to a different family — same as getFamilyDocumentForFamily returning null, never distinguishing "not found" from "not yours." */
export async function downloadFamilyDocument(familyId: string, documentId: string) {
  const doc = await getFamilyDocumentForFamily(familyId, documentId);
  if (!doc) return null;

  const file = await storageService.download(doc.storageKey);
  if (!file) return null;

  return { ...file, fileName: doc.fileName };
}

export async function updateFamilyDocument(
  familyId: string,
  documentId: string,
  input: Partial<{
    title: string;
    category: DocumentCategory;
    lovedOneId: string | null;
    tags: string[] | null;
  }>,
) {
  const [row] = await db
    .update(familyDocuments)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(familyDocuments.id, documentId), eq(familyDocuments.familyId, familyId)))
    .returning({ id: familyDocuments.id });
  return row ?? null;
}

/** The wrong-family case never reaches storage — the DB delete affects zero rows, so `row` is undefined and this returns null before storageService.delete() is ever called. */
export async function deleteFamilyDocument(familyId: string, documentId: string) {
  const [row] = await db
    .delete(familyDocuments)
    .where(and(eq(familyDocuments.id, documentId), eq(familyDocuments.familyId, familyId)))
    .returning({ id: familyDocuments.id, storageKey: familyDocuments.storageKey });
  if (!row) return null;

  await storageService.delete(row.storageKey);
  return { id: row.id };
}
