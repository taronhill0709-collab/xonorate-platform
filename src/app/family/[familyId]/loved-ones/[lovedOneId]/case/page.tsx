import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { computeUpcomingList } from "@/family/dashboard";
import { listCalendarEventsForFamily } from "@/family/calendar";
import { listFamilyDocuments } from "@/family/documents";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { ATTORNEY_PERSON_TYPES } from "@/family/case-people-types";
import { listCaseIssuesForLovedOne } from "@/family/case-issues";
import {
  computeCaseCompleteness,
  ensureFamilyCaseForLovedOne,
  hasAnyMissingInfo,
} from "@/family/case-overview";
import type { FamilyCaseStage } from "@/family/case-overview-types";
import { CaseTabs } from "./case-tabs";
import { CaseOverviewBoard } from "./case-overview-board";

export default async function CaseOverviewPage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const familyCase = await ensureFamilyCaseForLovedOne(familyId, lovedOneId);
  if (!familyCase) notFound();

  const [allCalendarEvents, documents, timelineEvents, casePeople, issues] = await Promise.all([
    listCalendarEventsForFamily(familyId),
    listFamilyDocuments(familyId, { lovedOneId }),
    listTimelineEventsForLovedOne(familyId, lovedOneId),
    listCasePeopleForLovedOne(familyId, lovedOneId),
    listCaseIssuesForLovedOne(familyId, lovedOneId),
  ]);

  const calendarEvents = allCalendarEvents.filter((e) => e.lovedOneId === lovedOneId);
  const upcoming = computeUpcomingList([lovedOne], calendarEvents).slice(0, 5);
  const attorney = casePeople.find((p) => ATTORNEY_PERSON_TYPES.includes(p.personType));
  const openIssueCount = issues.filter((i) => i.status !== "resolved").length;

  const completeness = computeCaseCompleteness({
    caseNumber: familyCase.caseNumber,
    court: familyCase.court,
    jurisdiction: familyCase.jurisdiction,
    stage: familyCase.stage as FamilyCaseStage,
    sentenceLength: lovedOne.sentenceLength,
    hasFacility: Boolean(lovedOne.facilityId),
    hasAttorney: Boolean(attorney),
    documentCount: documents.length,
    timelineEventCount: timelineEvents.length,
    casePeopleCount: casePeople.length,
  });

  return (
    <div className="space-y-8">
      <CaseTabs familyId={familyId} lovedOneId={lovedOneId} />

      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Case Organizer</p>
        <h1 className="font-serif text-2xl">{familyCase.caseLabel || lovedOne.preferredName || lovedOne.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Everything about this case, organized in one place. This is a private workspace, not legal
          advice, and nothing here makes a legal determination.
        </p>
      </div>

      {/* Coming Up */}
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">Coming Up</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing scheduled yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((item, i) => {
              const days = Math.round(
                (item.date.getTime() - new Date().setUTCHours(0, 0, 0, 0)) / 86_400_000,
              );
              return (
                <li key={i} className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
                  <span>{item.label}</span>
                  <span className="text-xs font-semibold text-muted">
                    {item.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {days >= 0 ? ` · ${days} ${days === 1 ? "day" : "days"} away` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CaseOverviewBoard
        familyId={familyId}
        lovedOneId={lovedOneId}
        caseLabel={familyCase.caseLabel}
        caseNumber={familyCase.caseNumber}
        jurisdiction={familyCase.jurisdiction}
        court={familyCase.court}
        state={familyCase.state}
        stage={familyCase.stage as FamilyCaseStage}
        charges={familyCase.charges}
        sentenceLength={lovedOne.sentenceLength}
        currentStatus={lovedOne.currentStatus}
        facilityName={lovedOne.facilityName}
        facilityState={lovedOne.facilityState}
        attorneyName={attorney?.name ?? null}
        attorneyOrganization={attorney?.organization ?? null}
      />

      {/* Completeness */}
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">What&rsquo;s Still Missing</h2>
        <p className="mt-1 text-sm text-muted">
          {hasAnyMissingInfo(completeness)
            ? "Some important information is still missing. No rush — add it as you find it."
            : "Everything on this checklist has been added."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {completeness.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{group.title}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span className={item.present ? "text-accent" : "text-muted"}>{item.present ? "✓" : "○"}</span>
                    <span className={item.present ? "" : "text-muted"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-2xl border border-dashed border-border bg-muted-background p-6">
        <h2 className="font-serif text-lg">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/family/${familyId}/loved-ones/${lovedOneId}/timeline/new`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Add Timeline Event
          </Link>
          <Link href={`/family/${familyId}/documents/new?lovedOneId=${lovedOneId}`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Upload Document
          </Link>
          <Link href={`/family/${familyId}/loved-ones/${lovedOneId}/case/people/new`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Add Person
          </Link>
          <Link href={`/family/${familyId}/notes/new?lovedOneId=${lovedOneId}`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Add Note
          </Link>
          <Link href={`/family/${familyId}/loved-ones/${lovedOneId}/case/issues/new`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Add Issue{openIssueCount > 0 ? ` (${openIssueCount} open)` : ""}
          </Link>
          <Link href={`/family/${familyId}/calendar/new?lovedOneId=${lovedOneId}`} className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand">
            Add Important Date
          </Link>
        </div>
      </section>
    </div>
  );
}
