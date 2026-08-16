import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers, supporterUpdates, users } from "@/db/schema";
import { Field, SubmitButton, TextArea, TextInput } from "../_components/field";
import { sendSupporterUpdate } from "./actions";

export default async function AdminSupporterUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  const [supporters, subscribers, updates] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.role, "supporter")),
    db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers),
    db.select().from(supporterUpdates).orderBy(desc(supporterUpdates.createdAt)),
  ]);
  const audienceSize = new Set(
    [...supporters, ...subscribers].map((r) => r.email),
  ).size;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-foreground">Supporter Updates</h1>
      <p className="mt-1 text-sm text-muted">
        Broadcast a one-off email to every supporter account and newsletter subscriber —
        case wins, petition wins, major platform news. Currently reaches{" "}
        {audienceSize.toLocaleString()} {audienceSize === 1 ? "person" : "people"}.
      </p>

      {sent !== undefined && (
        <div className="mt-6 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-brand">
          Update sent to {sent} recipient{sent === "1" ? "" : "s"}.
        </div>
      )}

      <form action={sendSupporterUpdate} className="mt-6 space-y-4">
        <Field label="Subject" name="subject">
          <TextInput
            id="subject"
            name="subject"
            placeholder="Jordan Ellis's compensation claim was approved"
            required
          />
        </Field>
        <Field label="Message" name="body">
          <TextArea id="body" name="body" rows={5} required />
        </Field>
        <SubmitButton>Send to {audienceSize.toLocaleString()} people</SubmitButton>
      </form>

      <h2 className="mt-10 font-serif text-lg text-foreground">History</h2>
      {updates.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No updates sent yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {updates.map((u) => (
            <li key={u.id} className="rounded-md border border-border p-4">
              <p className="text-xs text-muted">
                {u.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                · sent to {u.recipientCount.toLocaleString()}{" "}
                {u.recipientCount === 1 ? "person" : "people"}
              </p>
              <p className="mt-0.5 font-medium text-foreground">{u.subject}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{u.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
