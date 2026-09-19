"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CASE_PERSON_TYPE_LABELS, type CasePersonType } from "@/family/case-people-types";
import { deleteCasePersonAction, updateCasePersonAction } from "./actions";

export function EditCasePersonForm({
  familyId,
  lovedOneId,
  personId,
  name,
  personType,
  organization,
  email,
  phone,
  relationshipToCase,
  notes,
}: {
  familyId: string;
  lovedOneId: string;
  personId: string;
  name: string;
  personType: CasePersonType;
  organization: string | null;
  email: string | null;
  phone: string | null;
  relationshipToCase: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await updateCasePersonAction(familyId, lovedOneId, personId, formData);
    if (result.success) {
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}/case/people`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${name} from this case?`)) return;
    await deleteCasePersonAction(familyId, lovedOneId, personId);
    router.push(`/family/${familyId}/loved-ones/${lovedOneId}/case/people`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={name}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="personType" className="block text-sm font-medium">
          Role
        </label>
        <select
          id="personType"
          name="personType"
          defaultValue={personType}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(CASE_PERSON_TYPE_LABELS) as [CasePersonType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label htmlFor="organization" className="block text-sm font-medium">
          Organization <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="organization"
          name="organization"
          defaultValue={organization ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="relationshipToCase" className="block text-sm font-medium">
          Relationship to case <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="relationshipToCase"
          name="relationshipToCase"
          defaultValue={relationshipToCase ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={notes ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-brand" role="alert">
          {status.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={status.kind === "loading"}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {status.kind === "loading" ? "Saving…" : "Save Changes"}
        </button>
        <button type="button" onClick={handleDelete} className="text-sm text-muted transition hover:text-brand">
          Remove Person
        </button>
      </div>
    </form>
  );
}
