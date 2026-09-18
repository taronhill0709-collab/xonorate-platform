import { auth } from "@/auth";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/require-admin";
import { logAuditEvent } from "@/family/audit";
import type { Session } from "next-auth";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

type ActiveMembership = {
  session: Session;
  membershipId: string;
  role: "owner" | "member";
};

/**
 * The only thing that grants access to a family's data. Deliberately does
 * NOT let admins through — an admin who needs to read family data goes
 * through requireFamilyAdminAccess() below, which is separately authorized
 * and always audit-logged. Never call this from an admin route and expect
 * it to pass for an admin without membership.
 */
export async function requireFamilyMember(
  familyId: string,
): Promise<ActiveMembership> {
  const session = await auth();
  if (!session?.user) throw new ForbiddenError();

  const [membership] = await db
    .select({ id: familyMembers.id, role: familyMembers.role })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, session.user.id),
        eq(familyMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) throw new ForbiddenError();

  return { session, membershipId: membership.id, role: membership.role };
}

/** Owner-only actions: inviting/removing members, deleting the family. */
export async function requireFamilyOwner(
  familyId: string,
): Promise<ActiveMembership> {
  const membership = await requireFamilyMember(familyId);
  if (membership.role !== "owner") throw new ForbiddenError();
  return membership;
}

/**
 * The active families a user belongs to — powers the family switcher and
 * the "you don't have a family yet" redirect. Invited-but-not-active
 * memberships are excluded on purpose.
 */
export async function getUserFamilies(userId: string) {
  return db
    .select({
      familyId: familyMembers.familyId,
      role: familyMembers.role,
    })
    .from(familyMembers)
    .where(
      and(eq(familyMembers.userId, userId), eq(familyMembers.status, "active")),
    );
}

/**
 * The only sanctioned way for an admin to read family data. Distinct from
 * requireFamilyMember() on purpose — admin support access is a different
 * authorization path with its own audit trail, not membership by another
 * name. Every call writes an audit_log row; callers must pass a specific
 * action/targetType/targetId so the log is meaningful, not a generic
 * "admin looked at something."
 */
export async function requireFamilyAdminAccess(params: {
  familyId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  const session = await requireAdmin();
  await logAuditEvent({
    actor: session.user,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    familyId: params.familyId,
    metadata: params.metadata,
  });
  return session;
}
