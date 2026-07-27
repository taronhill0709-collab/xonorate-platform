import { db } from "@/db";
import { cases } from "@/db/schema";
import { Field, Select, SubmitButton, TextArea, TextInput } from "../../_components/field";
import { createPetition } from "../actions";

export default async function NewPetitionPage() {
  const caseRows = await db
    .select({ id: cases.id, clientName: cases.clientName })
    .from(cases)
    .orderBy(cases.clientName);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">New petition</h1>
      <form action={createPetition} className="mt-6 space-y-4">
        <Field label="Title" name="title">
          <TextInput id="title" name="title" required />
        </Field>
        <Field label="Slug (optional — generated from title if left blank)" name="slug">
          <TextInput id="slug" name="slug" />
        </Field>
        <Field label="Linked case (optional — leave blank for a general policy petition)" name="caseId">
          <Select id="caseId" name="caseId" defaultValue="">
            <option value="">None</option>
            {caseRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ask" name="askText">
          <TextArea id="askText" name="askText" rows={4} required />
        </Field>
        <Field label="Signature goal" name="goalCount">
          <TextInput id="goalCount" name="goalCount" type="number" defaultValue={1000} required />
        </Field>

        <SubmitButton>Create petition</SubmitButton>
      </form>
    </div>
  );
}
