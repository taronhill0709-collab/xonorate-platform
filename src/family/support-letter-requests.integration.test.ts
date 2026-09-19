// Real-database tests for support letter requests: token lookup/expiry
// (same lifecycle shape as invites.integration.test.ts), the public
// token-authenticated mutations refusing an invalid token, and the
// family-side deleteLetterRequest being scoped to whoever actually sent
// it. Does not exercise generateLetterRequestDraft's real AI call — it's
// a thin wrapper over generateSupportLetterDraft, already live-verified
// via support-letters (see docs/AI.md).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("support letter request lifecycle", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let requestsLib: typeof import("./support-letter-requests");

  let familyA: string, familyB: string, requesterId: string, lovedOneId: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    requestsLib = await import("./support-letter-requests");

    const [requester] = await db
      .insert(schema.users)
      .values({ email: `test-req-requester-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });
    requesterId = requester.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Request Test Family A", ownerUserId: requesterId },
        { name: "Request Test Family B", ownerUserId: requesterId },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    const [lovedOne] = await db
      .insert(schema.lovedOnes)
      .values({ familyId: familyA, name: "Test Loved One" })
      .returning({ id: schema.lovedOnes.id });
    lovedOneId = lovedOne.id;
  });

  afterAll(async () => {
    await db.delete(schema.supportLetterRequests).where(eq(schema.supportLetterRequests.familyId, familyA));
    await db.delete(schema.lovedOnes).where(eq(schema.lovedOnes.id, lovedOneId));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    await db.delete(schema.users).where(eq(schema.users.id, requesterId));
  });

  it("reports an unknown token as not found", async () => {
    const result = await requestsLib.lookupLetterRequestToken("not-a-real-token");
    expect(result.valid).toBe(false);
  });

  it("creates a valid, findable request", async () => {
    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "family",
      inviteeName: "Aunt Lisa",
      inviteeEmail: "aunt-lisa@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    const lookup = await requestsLib.lookupLetterRequestToken(row.token);
    expect(lookup.valid).toBe(true);
    if (lookup.valid) {
      expect(lookup.inviteeName).toBe("Aunt Lisa");
      expect(lookup.status).toBe("pending");
    }
  });

  it("saves answers via a valid token and reflects them on lookup", async () => {
    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "character",
      inviteeName: "Uncle Joe",
      inviteeEmail: "uncle-joe@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    const saved = await requestsLib.saveLetterRequestAnswers(row.token, { relationship: "Uncle" });
    expect(saved).not.toBeNull();

    const lookup = await requestsLib.lookupLetterRequestToken(row.token);
    expect(lookup.valid).toBe(true);
    if (lookup.valid) expect(lookup.answers.relationship).toBe("Uncle");
  });

  it("refuses every mutation for an invalid token", async () => {
    expect(await requestsLib.saveLetterRequestAnswers("bad-token", { a: "b" })).toBeNull();
    expect(await requestsLib.updateLetterRequestContent("bad-token", "content")).toBeNull();
    expect(await requestsLib.approveLetterRequest("bad-token")).toBeNull();
  });

  it("treats an expired request as invalid", async () => {
    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "employer",
      inviteeName: "Expired Person",
      inviteeEmail: "expired@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    await db
      .update(schema.supportLetterRequests)
      .set({ tokenExpires: new Date(Date.now() - 1000) })
      .where(eq(schema.supportLetterRequests.id, row.id));

    const lookup = await requestsLib.lookupLetterRequestToken(row.token);
    expect(lookup.valid).toBe(false);
    if (!lookup.valid) expect(lookup.reason).toBe("expired");

    expect(await requestsLib.saveLetterRequestAnswers(row.token, { a: "b" })).toBeNull();
  });

  it("approving sets status and approvedAt", async () => {
    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "community",
      inviteeName: "Community Leader",
      inviteeEmail: "leader@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    const approved = await requestsLib.approveLetterRequest(row.token);
    expect(approved?.status).toBe("approved");
    expect(approved?.approvedAt).not.toBeNull();
  });

  it("only lets the original requester cancel their own request", async () => {
    const [otherUser] = await db
      .insert(schema.users)
      .values({ email: `test-req-other-${Date.now()}@example.test`, role: "supporter" })
      .returning({ id: schema.users.id });

    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "faith_leader",
      inviteeName: "Pastor Smith",
      inviteeEmail: "pastor@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    const wrongUserResult = await requestsLib.deleteLetterRequest(familyA, row.id, otherUser.id);
    expect(wrongUserResult).toBeNull();

    const wrongFamilyResult = await requestsLib.deleteLetterRequest(familyB, row.id, requesterId);
    expect(wrongFamilyResult).toBeNull();

    const correctResult = await requestsLib.deleteLetterRequest(familyA, row.id, requesterId);
    expect(correctResult?.id).toBe(row.id);

    await db.delete(schema.users).where(eq(schema.users.id, otherUser.id));
  });

  it("scopes listLetterRequestsForFamily to the given family", async () => {
    const row = await requestsLib.createLetterRequest({
      familyId: familyA,
      lovedOneId,
      requestedByUserId: requesterId,
      purpose: "parole",
      inviteeName: "List Check",
      inviteeEmail: "list-check@example.test",
      inviteUrl: (token) => `https://example.test/letter-request/${token}`,
    });

    const familyAResults = await requestsLib.listLetterRequestsForFamily(familyA);
    expect(familyAResults.map((r) => r.id)).toContain(row.id);

    const familyBResults = await requestsLib.listLetterRequestsForFamily(familyB);
    expect(familyBResults.map((r) => r.id)).not.toContain(row.id);
  });
});
