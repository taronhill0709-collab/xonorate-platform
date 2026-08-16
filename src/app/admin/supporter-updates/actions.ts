"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers, supporterUpdates, users } from "@/db/schema";
import { getOrigin } from "@/lib/request-ip";
import { requireAdmin } from "@/lib/require-admin";
import { sendSupporterUpdateEmail } from "@/lib/supporter-update-email";

const sendFormSchema = z.object({
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export async function sendSupporterUpdate(formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const { subject, body } = sendFormSchema.parse(raw);

  const [supporters, subscribers] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.role, "supporter")),
    db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers),
  ]);

  // Supporters and newsletter subscribers overlap freely — dedupe so no one
  // gets the same update twice.
  const recipients = [...new Set([...supporters, ...subscribers].map((r) => r.email))];

  const origin = await getOrigin();

  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendSupporterUpdateEmail({ to, subject, body, siteUrl: origin }),
    ),
  );
  const recipientCount = results.filter((r) => r.status === "fulfilled").length;

  await db.insert(supporterUpdates).values({ subject, body, recipientCount });

  revalidatePath("/admin/supporter-updates");
  redirect(`/admin/supporter-updates?sent=${recipientCount}`);
}
