import Link from "next/link";
import { listLovedOnesForFamily } from "@/family/loved-ones";
import { listFamilyMembers } from "@/family/invites";

// A minimal hub, not the full "What needs attention / Upcoming / Journey /
// Quick actions" dashboard (that's the next Phase 1 milestone) — this exists
// so Family Creation → Invitation → Loved One is a usable, real flow now.
export default async function FamilyHomePage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const [lovedOnes, members] = await Promise.all([
    listLovedOnesForFamily(familyId),
    listFamilyMembers(familyId),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Loved ones</h2>
          <Link
            href={`/family/${familyId}/loved-ones/new`}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
          >
            Add a Loved One
          </Link>
        </div>
        {lovedOnes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <h3 className="font-serif text-base">No loved ones yet</h3>
            <p className="mt-2 text-sm text-muted">
              Add your loved one to start organizing their information, dates,
              and plans in one place.
            </p>
            <Link
              href={`/family/${familyId}/loved-ones/new`}
              className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Add Your Loved One
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {lovedOnes.map((lo) => (
              <li key={lo.id}>
                <Link
                  href={`/family/${familyId}/loved-ones/${lo.id}`}
                  className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm transition hover:ring-1 hover:ring-brand"
                >
                  <span>{lo.preferredName || lo.name}</span>
                  <span className="text-muted">
                    {lo.facilityName ?? "No facility on file"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Family members</h2>
          <Link
            href={`/family/${familyId}/members`}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
          >
            Manage Members
          </Link>
        </div>
        {members.length <= 1 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <h3 className="font-serif text-base">Invite your family</h3>
            <p className="mt-2 text-sm text-muted">
              Invite trusted family members to help organize and support your
              loved one.
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
            {members.length} people in this family.
          </p>
        )}
      </section>
    </div>
  );
}
