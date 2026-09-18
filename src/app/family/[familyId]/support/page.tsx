import Link from "next/link";
import { listSupportPeopleForFamily } from "@/family/support-people";

export default async function SupportNetworkPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const people = await listSupportPeopleForFamily(familyId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Support Network</h1>
          <p className="mt-1 text-sm text-muted">
            The people willing to help — with housing, work, transportation,
            or just being there.
          </p>
        </div>
        <Link
          href={`/family/${familyId}/support/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Person
        </Link>
      </div>

      {people.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No support people yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Add the people who can help with housing, employment,
            transportation, and more.
          </p>
          <Link
            href={`/family/${familyId}/support/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add Support Person
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {people.map((person) => {
            const tags = (person.canHelpWith as string[] | null) ?? [];
            return (
              <li
                key={person.id}
                className="rounded-2xl border border-border bg-muted-background p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/family/${familyId}/support/${person.id}/edit`}
                      className="font-medium transition hover:text-brand"
                    >
                      {person.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {[person.relationship, person.role].filter(Boolean).join(" · ") || "—"}
                      {person.lovedOneName ? ` — about ${person.lovedOneName}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    {person.email && <p>{person.email}</p>}
                    {person.phone && <p>{person.phone}</p>}
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
