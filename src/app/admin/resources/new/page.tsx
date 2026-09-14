import { SubmitButton } from "@/app/admin/_components/field";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { createResource } from "../actions";
import { ResourceFormFields } from "../resource-form";

export default async function NewResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const caseRows = await db.select({ id: cases.id, clientName: cases.clientName }).from(cases).orderBy(cases.clientName);

  const defaultValues = {
    title: "",
    category: "knowledge",
    subcategory: "",
    resourceType: "guide",
    audiences: [],
    state: "",
    organization: "",
    author: "",
    description: "",
    body: "",
    url: "",
    tags: "",
    featured: false,
    status: "pending",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New resource</h1>
      <form action={createResource} className="mt-6 space-y-4">
        <ResourceFormFields
          defaultValues={defaultValues}
          caseRows={caseRows}
          selectedCaseIds={[]}
          selectedIssueTags={[]}
          error={error}
        />
        <SubmitButton>Create resource</SubmitButton>
      </form>
    </div>
  );
}
