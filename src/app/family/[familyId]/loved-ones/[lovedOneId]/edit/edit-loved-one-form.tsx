"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLovedOneAction, updateLovedOneAction } from "./actions";
import type { DateConfidence } from "@/family/loved-ones";

type LovedOneData = {
  name: string;
  preferredName: string | null;
  inmateId: string | null;
  facilityName: string | null;
  facilityState: string | null;
  state: string | null;
  sentenceLength: string | null;
  currentStatus: string | null;
  arrestDate: string | null;
  arrestDateConfidence: DateConfidence;
  convictionDate: string | null;
  convictionDateConfidence: DateConfidence;
  paroleEligibilityDate: string | null;
  paroleEligibilityDateConfidence: DateConfidence;
  paroleHearingDate: string | null;
  paroleHearingDateConfidence: DateConfidence;
  expectedReleaseDate: string | null;
  expectedReleaseDateConfidence: DateConfidence;
};

const CONFIDENCE_OPTIONS: { value: DateConfidence; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "approximate", label: "Approximate" },
  { value: "unknown", label: "Unknown" },
];

function DateField({
  name,
  label,
  defaultDate,
  defaultConfidence,
}: {
  name: string;
  label: string;
  defaultDate: string | null;
  defaultConfidence: DateConfidence;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
      <div>
        <label htmlFor={name} className="block text-sm font-medium">
          {label}
        </label>
        <input
          id={name}
          type="date"
          name={name}
          defaultValue={defaultDate ?? ""}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <select
        name={`${name}Confidence`}
        defaultValue={defaultConfidence}
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
      >
        {CONFIDENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EditLovedOneForm({
  familyId,
  lovedOneId,
  lovedOne,
  canDelete,
}: {
  familyId: string;
  lovedOneId: string;
  lovedOne: LovedOneData;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "saved" }
  >({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(e.currentTarget);
    const result = await updateLovedOneAction(familyId, lovedOneId, formData);
    if (result.success) {
      setStatus({ kind: "saved" });
      router.push(`/family/${familyId}/loved-ones/${lovedOneId}`);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${lovedOne.name} from this family? This cannot be undone.`)) return;
    await deleteLovedOneAction(familyId, lovedOneId);
    router.push(`/family/${familyId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-serif text-lg">Basic information</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={lovedOne.name}
            required
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="preferredName" className="block text-sm font-medium">
            Preferred name
          </label>
          <input
            id="preferredName"
            name="preferredName"
            defaultValue={lovedOne.preferredName ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="facilityName" className="block text-sm font-medium">
              Facility
            </label>
            <input
              id="facilityName"
              name="facilityName"
              defaultValue={lovedOne.facilityName ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="facilityState" className="block text-sm font-medium">
              State
            </label>
            <input
              id="facilityState"
              name="facilityState"
              defaultValue={lovedOne.facilityState ?? lovedOne.state ?? ""}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="inmateId" className="block text-sm font-medium">
            Inmate ID
          </label>
          <input
            id="inmateId"
            name="inmateId"
            defaultValue={lovedOne.inmateId ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="currentStatus" className="block text-sm font-medium">
            Current status
          </label>
          <input
            id="currentStatus"
            name="currentStatus"
            placeholder="e.g. Incarcerated, On parole, Released"
            defaultValue={lovedOne.currentStatus ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="sentenceLength" className="block text-sm font-medium">
            Sentence length
          </label>
          <input
            id="sentenceLength"
            name="sentenceLength"
            defaultValue={lovedOne.sentenceLength ?? ""}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-lg">Important dates</h2>
          <p className="text-sm text-muted">
            Not sure about a date? Mark it as approximate or unknown — you can
            update it later.
          </p>
        </div>
        <DateField
          name="arrestDate"
          label="Arrest date"
          defaultDate={lovedOne.arrestDate}
          defaultConfidence={lovedOne.arrestDateConfidence}
        />
        <DateField
          name="convictionDate"
          label="Conviction date"
          defaultDate={lovedOne.convictionDate}
          defaultConfidence={lovedOne.convictionDateConfidence}
        />
        <DateField
          name="paroleEligibilityDate"
          label="Parole eligibility date"
          defaultDate={lovedOne.paroleEligibilityDate}
          defaultConfidence={lovedOne.paroleEligibilityDateConfidence}
        />
        <DateField
          name="paroleHearingDate"
          label="Parole hearing date"
          defaultDate={lovedOne.paroleHearingDate}
          defaultConfidence={lovedOne.paroleHearingDateConfidence}
        />
        <DateField
          name="expectedReleaseDate"
          label="Expected release date"
          defaultDate={lovedOne.expectedReleaseDate}
          defaultConfidence={lovedOne.expectedReleaseDateConfidence}
        />
      </section>

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
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-muted transition hover:text-brand"
          >
            Remove Loved One
          </button>
        )}
      </div>
    </form>
  );
}
