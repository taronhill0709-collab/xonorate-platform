import { db } from "@/db";
import { auditLog } from "@/db/schema";
import type { Session } from "next-auth";

/**
 * Every sensitive family action (member invited/removed, document
 * viewed/deleted, family deleted) and every admin read of family data
 * writes one of these. Never skip this for admin reads — it's the only
 * record a family has that someone outside their membership looked.
 */
export async function logAuditEvent(params: {
  actor: Session["user"];
  action: string;
  targetType: string;
  targetId: string;
  familyId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    familyId: params.familyId,
    metadata: params.metadata,
  });
}
