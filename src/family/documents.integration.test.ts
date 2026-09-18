// Real-database test for the DB-scoping guard on family documents — same
// pattern as loved-ones.integration.test.ts and calendar.integration.test.ts.
//
// Rows are inserted directly via db.insert() rather than through
// uploadFamilyDocument(), and deleteFamilyDocument's happy path (which
// calls storageService.delete()) is intentionally not exercised here — this
// sandbox has no live Netlify Blobs credentials, same limitation as the
// database itself. What IS covered, and is the actual security-critical
// property: a documentId scoped to the wrong family is never readable,
// updatable, or (crucially) able to trigger a storage delete call at all —
// deleteFamilyDocument's wrong-family case returns before ever touching
// storage, which is exactly what makes it safe to test here.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("family document cross-family isolation", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let documentsLib: typeof import("./documents");

  let familyA: string, familyB: string, documentA: string, ownerA: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    documentsLib = await import("./documents");

    const [owner] = await db
      .insert(schema.users)
      .values({ email: `test-doc-owner-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    ownerA = owner.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Doc Test Family A", ownerUserId: ownerA },
        { name: "Doc Test Family B", ownerUserId: ownerA },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const [doc] = await db
      .insert(schema.familyDocuments)
      .values({
        familyId: familyA,
        uploadedByUserId: ownerA,
        category: "other",
        title: "Test Document",
        storageKey: "not-a-real-blob-key",
        fileName: "test.pdf",
        fileSize: 1234,
        mimeType: "application/pdf",
      })
      .returning({ id: schema.familyDocuments.id });
    documentA = doc.id;
  });

  afterAll(async () => {
    await db.delete(schema.familyDocuments).where(eq(schema.familyDocuments.familyId, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, ownerA));
  });

  it("finds the document under its own family", async () => {
    const row = await documentsLib.getFamilyDocumentForFamily(familyA, documentA);
    expect(row?.id).toBe(documentA);
  });

  it("returns null when the document is requested under a different family", async () => {
    const row = await documentsLib.getFamilyDocumentForFamily(familyB, documentA);
    expect(row).toBeNull();
  });

  it("refuses to update a document scoped to a different family", async () => {
    const result = await documentsLib.updateFamilyDocument(familyB, documentA, {
      title: "Hijacked Title",
    });
    expect(result).toBeNull();

    const unchanged = await documentsLib.getFamilyDocumentForFamily(familyA, documentA);
    expect(unchanged?.title).toBe("Test Document");
  });

  it("refuses to delete a document scoped to a different family, without ever touching storage", async () => {
    const result = await documentsLib.deleteFamilyDocument(familyB, documentA);
    expect(result).toBeNull();

    const stillThere = await documentsLib.getFamilyDocumentForFamily(familyA, documentA);
    expect(stillThere).not.toBeNull();
  });

  it("scopes listFamilyDocuments to the given family", async () => {
    const familyAResults = await documentsLib.listFamilyDocuments(familyA);
    expect(familyAResults.map((d) => d.id)).toContain(documentA);

    const familyBResults = await documentsLib.listFamilyDocuments(familyB);
    expect(familyBResults.map((d) => d.id)).not.toContain(documentA);
  });
});
