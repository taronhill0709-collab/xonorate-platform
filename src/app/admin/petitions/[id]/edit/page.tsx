import { and, count, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { cases, petitions, signatures } from "@/db/schema";
import {
  Field,
  SavedBanner,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import { updatePetition } from "../../actions";

export default async function EditPetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

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

  const updatePetitionWithId = updatePetition.bind(null, id);

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

      <form action={updatePetitionWithId} className="mt-6 space-y-4">
        <Field label="Title" name="title">
          <TextInput id="title" name="title" defaultValue={petition.title} required />
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
    </div>
  );
}
