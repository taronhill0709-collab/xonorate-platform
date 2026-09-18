// Real-database tests for the invite token lifecycle: lookup, expiry, the
// email-match guard on acceptance (without it, a forwarded/leaked token
// could let anyone claim someone else's invite slot), and owner-scoped
// removal. sendMail() falls back to console.log without RESEND_API_KEY, so
// no mocking is needed to run this against a real database.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("family invite lifecycle", () => {
  let db: typeof import("@/db").db;
  let schema: typeof import("@/db/schema");
  let invites: typeof import("./invites");

  let familyId: string, ownerId: string, otherUserId: string;

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    schema = await import("@/db/schema");
    invites = await import("./invites");

    const [owner, other] = await db
      .insert(schema.users)
      .values([
        { email: `test-invite-owner-${Date.now()}@example.test`, role: "supporter" },
        { email: `test-invite-other-${Date.now()}@example.test`, role: "supporter" },
      ])
      .returning({ id: schema.users.id });
    ownerId = owner.id;
    otherUserId = other.id;

    const [family] = await db
      .insert(schema.families)
      .values({ name: "Invite Test Family", ownerUserId: ownerId })
      .returning({ id: schema.families.id });
    familyId = family.id;

    await db.insert(schema.familyMembers).values({
      familyId,
      userId: ownerId,
      role: "owner",
      status: "active",
    });
  });

  afterAll(async () => {
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, familyId));
    await db.delete(schema.families).where(eq(schema.families.id, familyId));
    await db.delete(schema.users).where(eq(schema.users.id, ownerId));
    await db.delete(schema.users).where(eq(schema.users.id, otherUserId));
  });

  it("reports an unknown token as not found", async () => {
    const result = await invites.lookupInviteToken("not-a-real-token");
    expect(result.valid).toBe(false);
  });

  it("creates a valid, findable invite", async () => {
    const invitedEmail = "invitee@example.test";
    const result = await invites.inviteFamilyMember({
      familyId,
      familyName: "Invite Test Family",
      email: invitedEmail,
      role: "member",
      inviteUrl: (token) => `https://example.test/family/invite/${token}`,
    });
    expect(result.success).toBe(true);

    const [row] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.invitedEmail, invitedEmail));
    expect(row.status).toBe("invited");
    expect(row.inviteToken).toBeTruthy();

    const lookup = await invites.lookupInviteToken(row.inviteToken!);
    expect(lookup.valid).toBe(true);
  });

  it("rejects acceptance when the logged-in user's email doesn't match the invite", async () => {
    const invitedEmail = "mismatch-invitee@example.test";
    await invites.inviteFamilyMember({
      familyId,
      familyName: "Invite Test Family",
      email: invitedEmail,
      role: "member",
      inviteUrl: (token) => `https://example.test/family/invite/${token}`,
    });
    const [row] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.invitedEmail, invitedEmail));

    const result = await invites.acceptInvite(
      row.inviteToken!,
      otherUserId,
      "someone-else@example.test",
    );
    expect(result.success).toBe(false);

    const [unchanged] = await db
      .select({ status: schema.familyMembers.status, userId: schema.familyMembers.userId })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, row.id));
    expect(unchanged.status).toBe("invited");
    expect(unchanged.userId).toBeNull();
  });

  it("accepts when the logged-in user's email matches, and clears the token", async () => {
    const invitedEmail = "matching-invitee@example.test";
    await invites.inviteFamilyMember({
      familyId,
      familyName: "Invite Test Family",
      email: invitedEmail,
      role: "member",
      inviteUrl: (token) => `https://example.test/family/invite/${token}`,
    });
    const [row] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.invitedEmail, invitedEmail));

    const result = await invites.acceptInvite(row.inviteToken!, otherUserId, invitedEmail);
    expect(result.success).toBe(true);

    const [accepted] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, row.id));
    expect(accepted.status).toBe("active");
    expect(accepted.userId).toBe(otherUserId);
    expect(accepted.inviteToken).toBeNull();
  });

  it("treats an expired invite as invalid", async () => {
    const invitedEmail = "expired-invitee@example.test";
    await invites.inviteFamilyMember({
      familyId,
      familyName: "Invite Test Family",
      email: invitedEmail,
      role: "member",
      inviteUrl: (token) => `https://example.test/family/invite/${token}`,
    });
    const [row] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.invitedEmail, invitedEmail));

    await db
      .update(schema.familyMembers)
      .set({ inviteTokenExpires: new Date(Date.now() - 1000) })
      .where(eq(schema.familyMembers.id, row.id));

    const lookup = await invites.lookupInviteToken(row.inviteToken!);
    expect(lookup.valid).toBe(false);
    if (!lookup.valid) expect(lookup.reason).toBe("expired");
  });

  it("only removes the member row scoped to the given family", async () => {
    const [family2] = await db
      .insert(schema.families)
      .values({ name: "Invite Test Family 2", ownerUserId: ownerId })
      .returning({ id: schema.families.id });

    const [membership] = await db
      .insert(schema.familyMembers)
      .values({ familyId, userId: otherUserId, role: "member", status: "active" })
      .returning({ id: schema.familyMembers.id });

    const wrongFamilyResult = await invites.removeFamilyMember(family2.id, membership.id);
    expect(wrongFamilyResult).toBeNull();

    const correctFamilyResult = await invites.removeFamilyMember(familyId, membership.id);
    expect(correctFamilyResult?.id).toBe(membership.id);

    await db.delete(schema.families).where(eq(schema.families.id, family2.id));
  });
});
