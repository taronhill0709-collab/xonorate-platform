import { CreateFamilyForm } from "./create-family-form";

export default function NewFamilyPage() {
  return (
    <div className="rounded-2xl border border-border bg-muted-background p-10 text-center">
      <h1 className="font-serif text-3xl">Welcome to Xonorate Family</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        A simple place to organize the information, people, dates, and plans
        that help you support your loved one.
      </p>
      <div className="mt-8">
        <CreateFamilyForm />
      </div>
      <p className="mt-6 text-xs text-muted">
        Private to your family. Only people you invite can access this
        information.
      </p>
    </div>
  );
}
