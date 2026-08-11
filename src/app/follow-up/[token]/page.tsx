import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { inquiries, inquiryInfoRequests } from "@/db/schema";
import { inquiryInfoPresetLabel } from "@/lib/inquiry-info-requests";
import { FollowUpForm } from "./follow-up-form";

export default async function FollowUpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.followUpToken, token))
    .limit(1);
  if (!inquiry) notFound();

  const [latestRequest] = await db
    .select()
    .from(inquiryInfoRequests)
    .where(eq(inquiryInfoRequests.inquiryId, inquiry.id))
    .orderBy(desc(inquiryInfoRequests.createdAt))
    .limit(1);

  const items = ((latestRequest?.requestedItems ?? []) as string[]).map((key) => ({
    key,
    label: inquiryInfoPresetLabel(key),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">
          Following up on {inquiry.personName}&apos;s case
        </h1>
        {inquiry.status === "needs_more_info" ? (
          <>
            <p className="mt-2 text-sm text-muted">
              Thank you for submitting this case to Xonorate Media. Please share what you can
              below — you don&apos;t need everything to submit.
            </p>
            {latestRequest?.requestedNote && (
              <p className="mt-4 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
                {latestRequest.requestedNote}
              </p>
            )}
            <FollowUpForm token={token} items={items} />
          </>
        ) : (
          <p className="mt-4 rounded-md border border-border bg-brand-light px-4 py-3 text-sm text-foreground">
            We&apos;ve already received your follow-up — thank you. Our team will reach out if
            we need anything else.
          </p>
        )}
      </main>
    </>
  );
}
