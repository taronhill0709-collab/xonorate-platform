import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserFamilies } from "@/family/authz";

export default async function FamilyIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/family");

  const memberships = await getUserFamilies(session.user.id);

  if (memberships.length === 0) redirect("/family/new");
  if (memberships.length === 1) redirect(`/family/${memberships[0].familyId}`);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl">Your families</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {memberships.map((m) => (
          <Link
            key={m.familyId}
            href={`/family/${m.familyId}`}
            className="rounded-2xl border border-border bg-muted-background p-6 transition hover:border-brand"
          >
            <p className="font-serif text-lg">{m.familyName}</p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-muted uppercase">
              {m.role === "owner" ? "Owner" : "Family Member"}
            </p>
          </Link>
        ))}
      </div>
      <Link
        href="/family/new"
        className="inline-block rounded-xl border border-border px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
      >
        Create Another Family
      </Link>
    </div>
  );
}
