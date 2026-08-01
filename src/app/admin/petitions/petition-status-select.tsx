"use client";

import { useTransition } from "react";
import { updatePetitionStatus } from "./actions";
import { PETITION_STATUS_LABEL } from "@/lib/petition-status";

const STATUS_OPTIONS = ["draft", "published"] as const;

export function PetitionStatusSelect({
  petitionId,
  status,
}: {
  petitionId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          updatePetitionStatus(petitionId, next as (typeof STATUS_OPTIONS)[number]);
        });
      }}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60"
    >
      {STATUS_OPTIONS.map((value) => (
        <option key={value} value={value}>
          {PETITION_STATUS_LABEL[value]}
        </option>
      ))}
    </select>
  );
}
