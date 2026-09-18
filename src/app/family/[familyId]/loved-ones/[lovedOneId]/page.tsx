import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { getUpcomingKeyDates } from "@/family/dashboard";
import { listFamilyDocuments } from "@/family/documents";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/family/documents-types";

function nextUpcomingDate(lovedOne: Awaited<ReturnType<typeof getLovedOneForFamily>>) {
  if (!lovedOne) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const nearest = getUpcomingKeyDates(lovedOne, today)[0];
  if (!nearest) return null;

  const days = Math.round((nearest.date.getTime() - today.getTime()) / 86_400_000);
  return { label: nearest.label, days };
}

export default async function LovedOneProfilePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const upcoming = nextUpcomingDate(lovedOne);
  const documents = await listFamilyDocuments(familyId, { lovedOneId });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl">
              {lovedOne.preferredName || lovedOne.name}
            </h1>
            <p className="text-muted">
              {lovedOne.facilityName
                ? `${lovedOne.facilityName}${lovedOne.facilityState ? `, ${lovedOne.facilityState}` : ""}`
                : "No facility on file"}
            </p>
            {lovedOne.currentStatus && (
              <p className="mt-1 text-sm text-muted">{lovedOne.currentStatus}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {upcoming && (
              <span className="rounded-xl bg-accent/15 px-4 py-2 text-sm font-semibold text-accent">
                {upcoming.label} in {upcoming.days} {upcoming.days === 1 ? "day" : "days"}
              </span>
            )}
            <Link
              href={`/family/${familyId}/loved-ones/${lovedOneId}/edit`}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted-background p-8 text-center">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Journey</p>
        <h2 className="mt-2 font-serif text-lg">No timeline events yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Start building {lovedOne.preferredName || lovedOne.name}&rsquo;s
          journey by adding important dates and milestones.
        </p>
        <span className="mt-4 inline-block rounded-xl bg-background px-4 py-2 text-sm text-muted/70">
          Coming soon
        </span>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Support</p>
          <h2 className="mt-2 font-serif text-lg">No support people yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
            Add the people who can help with housing, employment,
            transportation, and more.
          </p>
          <span className="mt-4 inline-block rounded-xl bg-background px-4 py-2 text-sm text-muted/70">
            Coming soon
          </span>
        </section>

        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Documents</p>
          {documents.length === 0 ? (
            <div className="mt-2 text-center">
              <h2 className="font-serif text-lg">No documents yet</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                Keep important records organized in one private place.
              </p>
              <Link
                href={`/family/${familyId}/documents/new?lovedOneId=${lovedOneId}`}
                className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
              >
                Upload Document
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-sm">
                {documents.slice(0, 4).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/family/${familyId}/documents/${doc.id}/edit`}
                      className="flex items-center justify-between rounded-xl bg-background px-3 py-2 transition hover:ring-1 hover:ring-brand"
                    >
                      <span>{doc.title}</span>
                      <span className="text-xs font-semibold text-brand">
                        {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/family/${familyId}/documents`}
                className="mt-3 inline-block text-xs font-semibold text-brand"
              >
                {documents.length > 4 ? `View all ${documents.length} documents →` : "View documents →"}
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
