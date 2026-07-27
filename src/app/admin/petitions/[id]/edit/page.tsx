import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { cases, petitions } from "@/db/schema";
import {
  Field,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "../../../_components/field";
import { updatePetition } from "../../actions";

export default async function EditPetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const updatePetitionWithId = updatePetition.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">Edit {petition.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Public page:{" "}
        <a href={`/petitions/${petition.slug}`} className="underline">
          /petitions/{petition.slug}
        </a>
      </p>

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

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </div>
  );
}
