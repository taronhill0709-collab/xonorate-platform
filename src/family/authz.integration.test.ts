// Real-database authorization tests — no mocked query layer. These are the
// mandatory checks from the Family Support architecture plan: a bug here
// means one family can see another family's private data.
//
// Requires a real Postgres reachable via DATABASE_URL (see src/db/index.ts —
// same override the app itself supports). Skipped automatically otherwise,
// so `vitest run` stays green in environments without a database (including
// this sandbox, where `netlify dev` is unreliable). Run locally with:
//   DATABASE_URL=postgres://... npm run test:db
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

// auth() is mocked per-test to return whichever user is "logged in" for
// that assertion — the thing under test is the DB-backed authorization
// query in authz.ts, not NextAuth's session machinery itself.
let mockSessionUserId: string | null = null;
vi.mock("@/auth", () => ({
  auth: async () =>
    mockSessionUserId
      ? { user: { id: mockSessionUserId, role: mockRole } }
      : null,
}));
let mockRole: "supporter" | "admin" = "supporter";

describe.skipIf(!hasDb)("family authorization", () => {
  // Imported after the vi.mock above so authz.ts picks up the mocked auth().
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let authz: typeof import("./authz");

  let ownerA: string, memberA: string, invitedA: string, outsider: string, adminUser: string;
  let familyA: string, familyB: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    authz = await import("./authz");

    const [u1, u2, u3, u4, u5] = await db
      .insert(schema.users)
      .values([
        { email: `test-owner-a-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-member-a-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-invited-a-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-outsider-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-admin-${Date.now()}@example.test`, role: "admin" },
      ])
      .returning({ id: schema.users.id });
    ownerA = u1.id;
    memberA = u2.id;
    invitedA = u3.id;
    outsider = u4.id;
    adminUser = u5.id;

    const [famA, famB] = await db
      .insert(schema.families)
      .values([
        { name: "Test Family A", ownerUserId: ownerA },
        { name: "Test Family B", ownerUserId: outsider },
      ])
      .returning({ id: schema.families.id });
    familyA = famA.id;
    familyB = famB.id;

    await db.insert(schema.familyMembers).values([
      { familyId: familyA, userId: ownerA, role: "owner", status: "active" },
      { familyId: familyA, userId: memberA, role: "member", status: "active" },
      { familyId: familyA, userId: invitedA, role: "member", status: "invited" },
      { familyId: familyB, userId: outsider, role: "owner", status: "active" },
    ]);
  });

  afterAll(async () => {
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, familyA));
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, familyB));
    await db.delete(schema.families).where(eq(schema.families.id, familyA));
    await db.delete(schema.families).where(eq(schema.families.id, familyB));
    for (const id of [ownerA, memberA, invitedA, outsider, adminUser]) {
      await db.delete(schema.users).where(eq(schema.users.id, id));
    }
  });

  it("throws with no session at all", async () => {
    mockSessionUserId = null;
    await expect(authz.requireFamilyMember(familyA)).rejects.toThrow(
      authz.ForbiddenError,
    );
  });

  it("allows an active member to access their own family", async () => {
    mockSessionUserId = memberA;
    mockRole = "supporter";
    const membership = await authz.requireFamilyMember(familyA);
    expect(membership.role).toBe("member");
  });

  it("does not allow Family A's member to access Family B", async () => {
    mockSessionUserId = memberA;
    mockRole = "supporter";
    await expect(authz.requireFamilyMember(familyB)).rejects.toThrow(
      authz.ForbiddenError,
    );
  });

  it("does not allow an invited (non-active) member to access the family", async () => {
    mockSessionUserId = invitedA;
    mockRole = "supporter";
    await expect(authz.requireFamilyMember(familyA)).rejects.toThrow(
      authz.ForbiddenError,
    );
  });

  it("does not allow a non-owner member to perform owner-only actions", async () => {
    mockSessionUserId = memberA;
    mockRole = "supporter";
    await expect(authz.requireFamilyOwner(familyA)).rejects.toThrow(
      authz.ForbiddenError,
    );
  });

  it("allows the owner to perform owner-only actions", async () => {
    mockSessionUserId = ownerA;
    mockRole = "supporter";
    const membership = await authz.requireFamilyOwner(familyA);
    expect(membership.role).toBe("owner");
  });

  it("does not let a non-admin through requireFamilyAdminAccess", async () => {
    mockSessionUserId = memberA;
    mockRole = "supporter";
    await expect(
      authz.requireFamilyAdminAccess({
        familyId: familyA,
        action: "admin.family.viewed",
        targetType: "family",
        targetId: familyA,
      }),
    ).rejects.toThrow();
  });

  it("lets an admin through requireFamilyAdminAccess and writes an audit log row", async () => {
    mockSessionUserId = adminUser;
    mockRole = "admin";
    await authz.requireFamilyAdminAccess({
      familyId: familyA,
      action: "admin.family.viewed",
      targetType: "family",
      targetId: familyA,
    });

    const rows = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.familyId, familyA));

    expect(rows.some((r) => r.actorUserId === adminUser && r.action === "admin.family.viewed")).toBe(
      true,
    );

    await db.delete(schema.auditLog).where(eq(schema.auditLog.familyId, familyA));
  });
});
