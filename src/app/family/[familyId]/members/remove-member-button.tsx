"use client";

import { useRouter } from "next/navigation";
import { removeMemberAction } from "./actions";

export function RemoveMemberButton({
  familyId,
  familyMemberId,
  label,
}: {
  familyId: string;
  familyMemberId: string;
  label: string;
}) {
  const router = useRouter();

  async function handleClick() {
    if (!confirm(`Remove ${label} from this family?`)) return;
    await removeMemberAction(familyId, familyMemberId);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs font-semibold text-muted transition hover:text-brand"
    >
      Remove
    </button>
  );
}
