"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/family/authz";
import { updateFamilyCase } from "@/family/case-overview";
import { updateLovedOne, getLovedOneForFamily } from "@/family/loved-ones";
import { listCalendarEventsForFamily } from "@/family/calendar";
import { listFamilyDocuments } from "@/family/documents";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { listCaseIssuesForLovedOne } from "@/family/case-issues";
import { generateCaseSummary } from "@/family/ai/case-organizer";
import { AIRefusalError } from "@/family/ai";
import { familyCaseStageEnum } from "@/db/schema";

const schema = z.object({
  caseLabel: z.string().trim().optional(),
  caseNumber: z.string().trim().optional(),
  jurisdiction: z.string().trim().optional(),
  court: z.string().trim().optional(),
  state: z.string().trim().optional(),
  stage: z.enum(familyCaseStageEnum.enumValues),
  charges: z.string().trim().optional(),
  sentenceLength: z.string().trim().optional(),
  currentStatus: z.string().trim().optional(),
});

export async function updateCaseSnapshotAction(
  familyId: string,
  lovedOneId: string,
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { caseLabel, caseNumber, jurisdiction, court, state, stage, charges, sentenceLength, currentStatus } =
    parsed.data;

  await Promise.all([
    updateFamilyCase(familyId, lovedOneId, {
      caseLabel: caseLabel || null,
      caseNumber: caseNumber || null,
      jurisdiction: jurisdiction || null,
      court: court || null,
      state: state || null,
      stage,
      charges: charges || null,
    }),
    updateLovedOne(familyId, lovedOneId, {
      sentenceLength: sentenceLength || null,
      currentStatus: currentStatus || null,
    }),
  ]);

  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}/case`);
  revalidatePath(`/family/${familyId}/loved-ones/${lovedOneId}`);
  return { success: true };
}

/** The one place the Case Organizer calls the AI — see docs/AI.md's context rule for exactly what crosses the boundary (structured case-snapshot fields, timeline titles/types/dates, note/issue text, and people — never document contents, since nothing extracts them yet). */
export async function generateCaseSummaryAction(
  familyId: string,
  lovedOneId: string,
): Promise<{ success: true; summary: string } | { success: false; error: string }> {
  await requireFamilyMember(familyId);

  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) return { success: false, error: "Loved one not found." };

  const [allCalendarEvents, timelineEvents, casePeople, issues] = await Promise.all([
    listCalendarEventsForFamily(familyId),
    listTimelineEventsForLovedOne(familyId, lovedOneId),
    listCasePeopleForLovedOne(familyId, lovedOneId),
    listCaseIssuesForLovedOne(familyId, lovedOneId),
  ]);
  const documents = await listFamilyDocuments(familyId, { lovedOneId });

  try {
    const summary = await generateCaseSummary({
      lovedOneName: lovedOne.preferredName || lovedOne.name,
      chronology: timelineEvents.map((e) => ({ eventType: e.eventType, eventDate: e.eventDate, description: e.description })),
      documentTitles: documents.map((d) => d.title),
      people: casePeople.map((p) => ({ name: p.name, personType: p.personType })),
      openIssueTitles: issues.filter((i) => i.status !== "resolved").map((i) => i.title),
      upcomingDateCount: allCalendarEvents.filter((e) => e.lovedOneId === lovedOneId).length,
    });
    return { success: true, summary };
  } catch (err) {
    if (err instanceof AIRefusalError) {
      return { success: false, error: "The AI couldn't generate a summary right now — please try again." };
    }
    throw err;
  }
}
