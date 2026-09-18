import { requireFamilyMember } from "@/family/authz";
import { listFamilyMembers } from "@/family/invites";
import { InviteForm } from "./invite-form";
import { RemoveMemberButton } from "./remove-member-button";

export default async function FamilyMembersPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  const membership = await requireFamilyMember(familyId);
  const members = await listFamilyMembers(familyId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl">Family members</h1>
        <p className="mt-1 text-sm text-muted">
          Invite trusted family members to help organize and support your
          loved one. Only people you invite can access this family&rsquo;s
          information.
        </p>
      </div>

      {membership.role === "owner" && (
        <section className="rounded-2xl border border-border bg-muted-background p-6">
          <h2 className="font-serif text-base">Invite a family member</h2>
          <div className="mt-4">
            <InviteForm familyId={familyId} />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-muted-background p-6">
        <h2 className="font-serif text-base">Everyone in this family</h2>
        <ul className="mt-4 space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm"
            >
              <div>
                <span>{m.userName || m.userEmail || m.invitedEmail}</span>
                {m.status === "invited" && (
                  <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
                    Invitation sent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {m.role === "owner" ? "Owner" : "Family Member"}
                </span>
                {membership.role === "owner" && m.id !== membership.membershipId && (
                  <RemoveMemberButton
                    familyId={familyId}
                    familyMemberId={m.id}
                    label={m.userName || m.userEmail || m.invitedEmail || "this person"}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
