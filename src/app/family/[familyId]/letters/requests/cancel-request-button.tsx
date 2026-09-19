"use client";

import { useRouter } from "next/navigation";
import { cancelLetterRequestAction } from "./actions";

export function CancelRequestButton({
  familyId,
  requestId,
  inviteeName,
}: {
  familyId: string;
  requestId: string;
  inviteeName: string;
}) {
  const router = useRouter();

  async function handleClick() {
    if (!confirm(`Cancel this request to ${inviteeName}?`)) return;
    await cancelLetterRequestAction(familyId, requestId);
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="text-xs font-semibold text-muted transition hover:text-brand">
      Cancel
    </button>
  );
}
