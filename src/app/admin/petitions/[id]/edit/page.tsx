import { and, count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { cases, petitions, petitionUpdates, signatures } from "@/db/schema";
import {
  Field,
  SavedBanner,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import { addPetitionUpdate, deletePetitionUpdate, updatePetition } from "../../actions";

export default async function EditPetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; notified?: string }>;
}) {
  const { id } = await params;
  const { saved, notified } = await searchParams;

  const [petition] = await db
    .select()
    .from(petitions)
    .where(eq(petitions.id, id))
    .limit(1);
  if (!petition) notFound();

  const caseRows = await db
    .select({ id: cases.id, clientName: cases.clientName })
    .from(cases)
    .orderBy(cases.clientName);

  const [{ value: verifiedOnPlatform }] = await db
    .select({ value: count() })
    .from(signatures)
    .where(and(eq(signatures.petitionId, id), eq(signatures.verified, true)));

  const updates = await db
    .select()
    .from(petitionUpdates)
    .where(eq(petitionUpdates.petitionId, id))
    .orderBy(desc(petitionUpdates.createdAt));

  const updatePetitionWithId = updatePetition.bind(null, id);
  const addPetitionUpdateWithId = addPetitionUpdate.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">Edit {petition.title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Public page:{" "}
        <a href={`/petitions/${petition.slug}`} className="underline">
          /petitions/{petition.slug}
        </a>
      </p>

      {saved === "1" && <SavedBanner />}
      {notified !== undefined && (
        <div className="mb-6 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-brand">
          Update posted. Notified {notified} signer{notified === "1" ? "" : "s"} by email.
        </div>
      )}

      <form action={updatePetitionWithId} className="mt-6 space-y-4">
        <Field label="Title" name="title">
          <TextInput id="title" name="title" defaultValue={petition.title} required />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={petition.status} required>
            <option value="draft">Draft — hidden from the public site</option>
            <option value="published">Published — live on the public site</option>
          </Select>
        </Field>
        <Field
          label="Linked case (optional — leave blank for a general policy petition)"
          name="caseId"
        >
          <Select id="caseId" name="caseId" defaultValue={petition.caseId ?? ""}>
            <option value="">None</option>
            {caseRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Addressed to (optional — the specific person or body with power to act, e.g. &quot;Governor Mike DeWine&quot;)"
          name="recipientName"
        >
          <TextInput
            id="recipientName"
            name="recipientName"
            placeholder="Governor Mike DeWine"
            defaultValue={petition.recipientName ?? ""}
          />
        </Field>
        <Field label="Ask" name="askText">
          <TextArea id="askText" name="askText" rows={4} defaultValue={petition.askText} required />
        </Field>
        <Field label="Signature goal" name="goalCount">
          <TextInput
            id="goalCount"
            name="goalCount"
            type="number"
            defaultValue={petition.goalCount}
            required
          />
        </Field>
        <Field
          label={`Starting signature count (optional — signatures carried over from a prior platform. ${verifiedOnPlatform} verified signature${verifiedOnPlatform === 1 ? "" : "s"} collected on this platform will be added on top of this number wherever the total is shown.)`}
          name="startingSignatureCount"
        >
          <TextInput
            id="startingSignatureCount"
            name="startingSignatureCount"
            type="number"
            defaultValue={petition.startingSignatureCount}
          />
        </Field>

        <SubmitButton>Save changes</SubmitButton>
      </form>

      <h2 className="mt-10 font-serif text-lg text-foreground">Updates</h2>
      <p className="mt-1 text-sm text-muted">
        Progress log shown on the public petition page — letters sent, meetings held, coverage,
        responses. This is what makes the petition read as a live campaign.
      </p>

      {updates.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No updates yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {updates.map((u) => (
            <li key={u.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted">
                    {u.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">{u.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{u.body}</p>
                </div>
                <form action={deletePetitionUpdate.bind(null, id, u.id)}>
                  <button type="submit" className="shrink-0 text-sm text-red-600 underline">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={addPetitionUpdateWithId} className="mt-6 space-y-4">
        <Field label="Update title" name="update-title">
          <TextInput
            id="update-title"
            name="title"
            placeholder="Delivered 500 signatures to the DA's office"
            required
          />
        </Field>
        <Field label="Details" name="update-body">
          <TextArea id="update-body" name="body" rows={3} required />
        </Field>
        <div className="flex items-center gap-2">
          <input
            id="notifySigners"
            name="notifySigners"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="notifySigners" className="text-sm text-foreground">
            Email {verifiedOnPlatform} verified signer{verifiedOnPlatform === 1 ? "" : "s"} about
            this update
          </label>
        </div>
        <SubmitButton>Post update</SubmitButton>
      </form>
    </div>
  );
}
