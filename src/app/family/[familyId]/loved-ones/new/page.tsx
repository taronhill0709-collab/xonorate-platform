import { CreateLovedOneForm } from "./create-loved-one-form";

export default async function NewLovedOnePage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { familyId } = await params;
  const { welcome } = await searchParams;

  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Add Your Loved One</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {welcome
          ? "Your family has been created. Now let's add the person you're supporting."
          : "Add another loved one to this family."}
      </p>
      <div className="mt-8">
        <CreateLovedOneForm familyId={familyId} />
      </div>
    </div>
  );
}
