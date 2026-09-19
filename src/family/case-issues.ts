import { db } from "@/db";
import { familyCaseIssues, familyCasePeople, users } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type { CaseIssuePriority, CaseIssueStatus } from "@/family/case-issues-types";

export type CaseIssueInput = {
  title: string;
  description?: string | null;
  status?: CaseIssueStatus;
  priority?: CaseIssuePriority;
  assignedPersonId?: string | null;
  relatedDocumentId?: string | null;
  relatedTimelineEventId?: string | null;
  dueDate?: string | null;
  resolutionNotes?: string | null;
};

export async function createCaseIssue(
  familyId: string,
  lovedOneId: string,
  createdByUserId: string,
  input: CaseIssueInput,
) {
  const [row] = await db
    .insert(familyCaseIssues)
    .values({ familyId, lovedOneId, createdByUserId, ...input })
    .returning();
  return row;
}

/** Open/in-progress/waiting first (oldest first within each), resolved last — a family cares about what's still outstanding before what's already settled. */
export async function listCaseIssuesForLovedOne(familyId: string, lovedOneId: string) {
  const rows = await db
    .select({
      id: familyCaseIssues.id,
      lovedOneId: familyCaseIssues.lovedOneId,
      title: familyCaseIssues.title,
      description: familyCaseIssues.description,
      status: familyCaseIssues.status,
      priority: familyCaseIssues.priority,
      createdByUserId: familyCaseIssues.createdByUserId,
      createdByName: users.name,
      createdByEmail: users.email,
      assignedPersonId: familyCaseIssues.assignedPersonId,
      assignedPersonName: familyCasePeople.name,
      relatedDocumentId: familyCaseIssues.relatedDocumentId,
      relatedTimelineEventId: familyCaseIssues.relatedTimelineEventId,
      dueDate: familyCaseIssues.dueDate,
      resolutionNotes: familyCaseIssues.resolutionNotes,
      createdAt: familyCaseIssues.createdAt,
    })
    .from(familyCaseIssues)
    .leftJoin(familyCasePeople, eq(familyCaseIssues.assignedPersonId, familyCasePeople.id))
    .leftJoin(users, eq(familyCaseIssues.createdByUserId, users.id))
    .where(and(eq(familyCaseIssues.familyId, familyId), eq(familyCaseIssues.lovedOneId, lovedOneId)))
    .orderBy(asc(familyCaseIssues.status), desc(familyCaseIssues.createdAt));
  return rows;
}

/** Same cross-family guard as every other family-scoped table: scopes on both issueId and familyId. */
export async function getCaseIssueForFamily(familyId: string, issueId: string) {
  const [row] = await db
    .select()
    .from(familyCaseIssues)
    .where(and(eq(familyCaseIssues.id, issueId), eq(familyCaseIssues.familyId, familyId)))
    .limit(1);
  return row ?? null;
}

export async function updateCaseIssue(familyId: string, issueId: string, input: Partial<CaseIssueInput>) {
  const [row] = await db
    .update(familyCaseIssues)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(familyCaseIssues.id, issueId), eq(familyCaseIssues.familyId, familyId)))
    .returning({ id: familyCaseIssues.id });
  return row ?? null;
}

export async function deleteCaseIssue(familyId: string, issueId: string) {
  const [row] = await db
    .delete(familyCaseIssues)
    .where(and(eq(familyCaseIssues.id, issueId), eq(familyCaseIssues.familyId, familyId)))
    .returning({ id: familyCaseIssues.id });
  return row ?? null;
}
