import { notFound } from "next/navigation";
import { requireFamilyMember } from "@/family/authz";
import { getLetterContent, getOwnSupportLetterForFamily } from "@/family/support-letters";
import type { SupportLetterPurpose } from "@/family/support-letters-types";
import { LetterWorkflow } from "./letter-workflow";

export default async function SupportLetterPage({
  params,
}: {
  params: Promise<{ familyId: string; letterId: string }>;
}) {
  const { familyId, letterId } = await params;
  const membership = await requireFamilyMember(familyId);

  const letter = await getOwnSupportLetterForFamily(familyId, letterId, membership.session.user.id);
  if (!letter) notFound();

  const content = getLetterContent(letter);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Letter for {letter.lovedOneName}
        </p>
        <h1 className="font-serif text-2xl">
          {letter.recipientName ? `To: ${letter.recipientName}` : "Support Letter"}
        </h1>
      </div>
      <LetterWorkflow
        key={content ?? "no-content"}
        familyId={familyId}
        letterId={letterId}
        purpose={letter.purpose as SupportLetterPurpose}
        lovedOneName={letter.lovedOneName}
        answers={(letter.answers as Record<string, string> | null) ?? {}}
        content={content}
        status={letter.status}
      />
    </div>
  );
}
