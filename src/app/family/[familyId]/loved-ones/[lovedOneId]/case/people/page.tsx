import Link from "next/link";
import { notFound } from "next/navigation";
import { getLovedOneForFamily } from "@/family/loved-ones";
import { listCasePeopleForLovedOne } from "@/family/case-people";
import { CASE_PERSON_TYPE_LABELS } from "@/family/case-people-types";
import { CaseTabs } from "../case-tabs";

export default async function CasePeoplePage({
  params,
}: {
  params: Promise<{ familyId: string; lovedOneId: string }>;
}) {
  const { familyId, lovedOneId } = await params;
  const lovedOne = await getLovedOneForFamily(familyId, lovedOneId);
  if (!lovedOne) notFound();

  const people = await listCasePeopleForLovedOne(familyId, lovedOneId);

  return (
    <div className="space-y-6">
      <CaseTabs familyId={familyId} lovedOneId={lovedOneId} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Case Organizer</p>
          <h1 className="font-serif text-2xl">People</h1>
        </div>
        <Link
          href={`/family/${familyId}/loved-ones/${lovedOneId}/case/people/new`}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
        >
          Add Person
        </Link>
      </div>

      {people.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-muted-background p-10 text-center">
          <h2 className="font-serif text-lg">No one added yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Add the attorney, witnesses, investigators, or anyone else connected to this case.
          </p>
          <Link
            href={`/family/${familyId}/loved-ones/${lovedOneId}/case/people/new`}
            className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            Add Person
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {people.map((person) => (
            <li key={person.id} className="rounded-2xl border border-border bg-muted-background p-5">
              <Link
                href={`/family/${familyId}/loved-ones/${lovedOneId}/case/people/${person.id}/edit`}
                className="flex items-start justify-between gap-4 transition hover:text-brand"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {[CASE_PERSON_TYPE_LABELS[person.personType], person.organization]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {person.relationshipToCase && (
                    <p className="mt-1 text-xs text-muted">{person.relationshipToCase}</p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted">
                  {person.email && <p>{person.email}</p>}
                  {person.phone && <p>{person.phone}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
