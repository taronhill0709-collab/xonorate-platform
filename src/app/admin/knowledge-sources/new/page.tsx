import { SubmitButton } from "@/app/admin/_components/field";
import { createKnowledgeSource } from "../actions";
import { KnowledgeSourceFormFields } from "../knowledge-source-form";

export default async function NewKnowledgeSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const defaultValues = {
    title: "",
    sourceKind: "case_law",
    authorityTier: "1",
    jurisdiction: "",
    citation: "",
    organization: "",
    summary: "",
    url: "",
    verifiedBy: "",
    status: "draft",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New knowledge source</h1>
      <form action={createKnowledgeSource} className="mt-6 space-y-4">
        <KnowledgeSourceFormFields defaultValues={defaultValues} selectedIssueTags={[]} error={error} />
        <SubmitButton>Create source</SubmitButton>
      </form>
    </div>
  );
}
