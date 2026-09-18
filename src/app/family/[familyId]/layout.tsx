import Link from "next/link";
import { notFound } from "next/navigation";
import { ForbiddenError, requireFamilyMember } from "@/family/authz";
import { getFamily } from "@/family/families";
import { listLovedOnesForFamily } from "@/family/loved-ones";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted transition hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function ComingSoonNavItem({ label }: { label: string }) {
  return (
    <span
      className="cursor-default text-sm text-muted/50"
      title="Coming soon"
    >
      {label}
    </span>
  );
}

export default async function FamilyDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;

  try {
    await requireFamilyMember(familyId);
  } catch (err) {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  const [family, lovedOnes] = await Promise.all([
    getFamily(familyId),
    listLovedOnesForFamily(familyId),
  ]);
  if (!family) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Family
          </p>
          <h1 className="font-serif text-xl">{family.name}</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-5">
          <NavLink href={`/family/${familyId}`} label="Home" />
          {lovedOnes[0] ? (
            <NavLink
              href={`/family/${familyId}/loved-ones/${lovedOnes[0].id}`}
              label="My Loved One"
            />
          ) : (
            <ComingSoonNavItem label="My Loved One" />
          )}
          <ComingSoonNavItem label="Prepare" />
          <NavLink href={`/family/${familyId}/calendar`} label="Calendar" />
          <NavLink href={`/family/${familyId}/documents`} label="Documents" />
          <NavLink href={`/family/${familyId}/notes`} label="Notes" />
          <NavLink href={`/family/${familyId}/support`} label="Support" />
          <NavLink href={`/family/${familyId}/members`} label="Members" />
        </nav>
      </div>
      {children}
    </div>
  );
}
