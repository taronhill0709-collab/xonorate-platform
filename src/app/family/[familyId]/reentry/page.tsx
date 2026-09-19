import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { listLovedOnesForFamily } from "@/family/loved-ones";

// Mirrors the nav's "My Loved One" behavior for the common single-loved-one
// case (straight to the board, no extra click), but — unlike that nav
// link, which always points at lovedOnes[0] — offers an explicit chooser
// when a family supports more than one loved one, since a reentry plan is
// per loved one and silently picking one would hide the others' plans.
export default async function ReentryPlannerIndexPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  await requireFamilyMember(familyId);
  const lovedOnes = await listLovedOnesForFamily(familyId);

  if (lovedOnes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
        <h1 className="font-serif text-2xl">Reentry Planner</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Add a loved one first before building their reentry plan.
        </p>
        <Link
          href={`/family/${familyId}/loved-ones/new`}
          className="mt-6 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add a Loved One
        </Link>
      </div>
    );
  }

  if (lovedOnes.length === 1) {
    redirect(`/family/${familyId}/reentry/${lovedOnes[0].id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Reentry Planner</h1>
        <p className="mt-1 text-sm text-muted">Choose who you&rsquo;re planning for.</p>
      </div>
      <ul className="space-y-3">
        {lovedOnes.map((lo) => (
          <li key={lo.id}>
            <Link
              href={`/family/${familyId}/reentry/${lo.id}`}
              className="block rounded-2xl border border-border bg-muted-background p-5 transition hover:border-brand"
            >
              <p className="font-medium">{lo.preferredName || lo.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
