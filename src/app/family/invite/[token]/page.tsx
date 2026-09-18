import { lookupInviteToken } from "@/family/invites";
import { getFamily } from "@/family/families";
import { AcceptInviteButton } from "./accept-invite-button";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lookup = await lookupInviteToken(token);

  if (!lookup.valid) {
    return (
      <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
        <h1 className="font-serif text-2xl">
          {lookup.reason === "expired" ? "This invitation has expired" : "Invitation not found"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {lookup.reason === "expired"
            ? "Ask the family owner to send a new invitation."
            : "This invitation link is no longer valid."}
        </p>
      </div>
    );
  }

  const family = await getFamily(lookup.familyId);

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-2xl">
        You&rsquo;ve been invited to join {family?.name ?? "a family"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Accepting will let you help organize and support their loved one.
        Only people invited by the family can see this information.
      </p>
      <div className="mt-6 flex justify-center">
        <AcceptInviteButton token={token} />
      </div>
    </div>
  );
}
