import Link from "next/link";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import { listFamilyMembers } from "@/family/invites";
import { listCalendarEventsForFamily } from "@/family/calendar";
import { computeAttentionItems, computeUpcomingList } from "@/family/dashboard";
import { listFamilyDocuments } from "@/family/documents";
import { listTimelineEventsForLovedOne } from "@/family/timeline";
import { listCaseIssuesForLovedOne } from "@/family/case-issues";

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
    >
      {label}
    </Link>
  );
}

export default async function FamilyDashboardPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const [lovedOnes, members] = await Promise.all([
    listLovedOnesForFamily(familyId),
    listFamilyMembers(familyId),
  ]);

  // No loved one yet — nothing to compute "what needs attention" or
  // "upcoming" against, so the dashboard is just the onboarding CTA rather
  // than four sections of empty states.
  if (lovedOnes.length === 0) {
    return (
      <div className="space-y-8">
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h1 className="font-serif text-2xl">No loved ones yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Add your loved one to start organizing their information, dates,
            and plans in one place.
          </p>
          <Link
            href={`/family/${familyId}/loved-ones/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add Your Loved One
          </Link>
        </section>

        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h2 className="font-serif text-lg">Family members</h2>
          {members.length <= 1 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <h3 className="font-serif text-base">Invite your family</h3>
              <p className="mt-2 text-sm text-muted">
                Invite trusted family members to help organize and support
                your loved one.
              </p>
              <Link
                href={`/family/${familyId}/members`}
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
              >
                Invite a Family Member
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              {members.length} people in this family.{" "}
              <Link href={`/family/${familyId}/members`} className="text-brand underline">
                Manage
              </Link>
            </p>
          )}
        </section>
      </div>
    );
  }

  const calendarEvents = await listCalendarEventsForFamily(familyId);
  const attentionItems = computeAttentionItems(lovedOnes, calendarEvents);
  const upcoming = computeUpcomingList(lovedOnes, calendarEvents);

  // Case Organizer dashboard integration (spec section 18) — kept
  // deliberately small: a family-wide total across every loved one's
  // case, not a duplicate of the detailed workspace itself. Computed
  // directly here rather than folded into computeAttentionItems/
  // computeUpcomingList, so those pure, already-tested functions keep
  // their existing contract.
  const [allDocuments, timelineEventCounts, openIssues] = await Promise.all([
    listFamilyDocuments(familyId),
    Promise.all(lovedOnes.map((lo) => listTimelineEventsForLovedOne(familyId, lo.id))),
    Promise.all(lovedOnes.map((lo) => listCaseIssuesForLovedOne(familyId, lo.id))),
  ]);
  const totalTimelineEvents = timelineEventCounts.reduce((sum, events) => sum + events.length, 0);
  const flatOpenIssues = openIssues.flat().filter((i) => i.status !== "resolved");

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand/30 bg-brand-light p-6">
        <h2 className="font-serif text-lg text-brand">What needs attention</h2>
        {attentionItems.length === 0 && flatOpenIssues.length === 0 ? (
          <p className="mt-3 text-sm text-foreground">
            Nothing urgent right now — you&rsquo;re all caught up.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {flatOpenIssues.length > 0 && (
              <li className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-3">
                <span>
                  {flatOpenIssues.length} open case {flatOpenIssues.length === 1 ? "question" : "questions"}
                </span>
              </li>
            )}
            {attentionItems.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl bg-background/60 px-4 py-3"
              >
                {item.kind === "upcoming_date" && (
                  <>
                    <span>
                      {item.lovedOneName}&rsquo;s {item.label.toLowerCase()} is in{" "}
                      {item.days} {item.days === 1 ? "day" : "days"}
                    </span>
                    <Link
                      href={`/family/${familyId}/loved-ones/${item.lovedOneId}`}
                      className="text-xs font-semibold text-brand"
                    >
                      View details →
                    </Link>
                  </>
                )}
                {item.kind === "missing_dates" && (
                  <>
                    <span>{item.lovedOneName}&rsquo;s key dates aren&rsquo;t added yet</span>
                    <Link
                      href={`/family/${familyId}/loved-ones/${item.lovedOneId}/edit`}
                      className="text-xs font-semibold text-brand"
                    >
                      Add dates →
                    </Link>
                  </>
                )}
                {item.kind === "calendar_event_soon" && (
                  <>
                    <span>
                      {item.title}
                      {item.lovedOneName ? ` — ${item.lovedOneName}` : ""} is in {item.days}{" "}
                      {item.days === 1 ? "day" : "days"}
                    </span>
                    <Link
                      href={`/family/${familyId}/calendar/${item.eventId}/edit`}
                      className="text-xs font-semibold text-brand"
                    >
                      View details →
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h3 className="font-serif text-base">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No upcoming dates or events yet. Add dates to a loved one&rsquo;s
              profile or add a calendar event to see them here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map((item, i) => {
                const href =
                  item.source === "key_date"
                    ? `/family/${familyId}/loved-ones/${item.lovedOneId}`
                    : `/family/${familyId}/calendar/${item.eventId}/edit`;
                return (
                  <li
                    key={i}
                    className={`pb-2 ${i < upcoming.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <Link href={href} className="flex justify-between transition hover:text-brand">
                      <span>
                        {item.label}
                        {item.lovedOneName ? ` — ${item.lovedOneName}` : ""}
                      </span>
                      <span className="text-muted">
                        {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h3 className="font-serif text-base">Loved ones</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {lovedOnes.map((lo) => (
              <li key={lo.id}>
                <Link
                  href={`/family/${familyId}/loved-ones/${lo.id}`}
                  className="flex items-center justify-between rounded-xl bg-background px-3 py-2 transition hover:ring-1 hover:ring-brand"
                >
                  <span>{lo.preferredName || lo.name}</span>
                  <span className="text-muted">{lo.facilityName ?? "No facility on file"}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/family/${familyId}/loved-ones/new`}
            className="mt-3 inline-block text-xs font-semibold text-brand"
          >
            Add another loved one →
          </Link>
        </section>

        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h3 className="font-serif text-base">Case</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{allDocuments.length} document{allDocuments.length === 1 ? "" : "s"}</li>
            <li>{totalTimelineEvents} timeline event{totalTimelineEvents === 1 ? "" : "s"}</li>
            <li>{flatOpenIssues.length} open issue{flatOpenIssues.length === 1 ? "" : "s"}</li>
          </ul>
          {lovedOnes[0] && (
            <Link
              href={`/family/${familyId}/loved-ones/${lovedOnes[0].id}/case`}
              className="mt-3 inline-block text-xs font-semibold text-brand"
            >
              Open Case Organizer →
            </Link>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h3 className="font-serif text-base">Quick actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickAction href={`/family/${familyId}/loved-ones/new`} label="Add a Loved One" />
          <QuickAction href={`/family/${familyId}/calendar/new`} label="Add Event" />
          <QuickAction href={`/family/${familyId}/members`} label="Invite a Family Member" />
          <QuickAction href={`/family/${familyId}/documents/new`} label="Add Document" />
          <QuickAction href={`/family/${familyId}/notes/new`} label="Add a Note" />
          <QuickAction href={`/family/${familyId}/support/new`} label="Add Support Person" />
          <QuickAction href={`/family/${familyId}/letters/new`} label="Write a Letter" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base">Family members</h3>
          <Link
            href={`/family/${familyId}/members`}
            className="text-xs font-semibold text-brand"
          >
            Manage →
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">{members.length} people in this family.</p>
      </section>
    </div>
  );
}
