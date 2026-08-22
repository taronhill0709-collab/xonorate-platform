import { db } from "@/db";
import { cases } from "@/db/schema";
import { sendMail } from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";
import { researchCaseCandidate } from "@/lib/nre-case-research";
import { saveCaseNreCandidate } from "@/lib/case-nre-candidates";

/** Researches one new exonerated-person candidate from the National
 * Registry of Exonerations and stages it for admin review — the daily
 * counterpart to content-pipeline.ts's roundup generation, kept as a
 * separate pipeline since the two write to different places (a staged
 * blob here vs. a pending `posts` row there) and serve different pages. */
export async function generateDailyCaseCandidate(): Promise<{ id: string; clientName: string } | null> {
  const roster = await db
    .select({ clientName: cases.clientName, state: cases.state, sourceUrl: cases.sourceUrl })
    .from(cases);

  const draft = await researchCaseCandidate(roster);
  if (!draft) return null;

  const id = crypto.randomUUID();
  await saveCaseNreCandidate(id, draft);
  await notifyAdminOfCandidate(id, draft.clientName);

  return { id, clientName: draft.clientName };
}

async function notifyAdminOfCandidate(id: string, clientName: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const reviewUrl = `${getSiteOrigin()}/admin/cases/new?candidateId=${id}`;

  if (!adminEmail) {
    console.log(
      `[case-candidate-pipeline] Candidate "${clientName}" ready — set ADMIN_NOTIFICATION_EMAIL to get notified.`,
    );
    return;
  }

  await sendMail({
    to: adminEmail,
    subject: `New exoneree candidate awaiting review: ${clientName}`,
    text: `A new exoneree case candidate was researched from the National Registry of Exonerations and is awaiting your review before it's added to the site.\n\n${clientName}\n\nReview it here: ${reviewUrl}`,
    html: `<p>A new exoneree case candidate was researched from the National Registry of Exonerations and is awaiting your review before it's added to the site.</p><p><strong>${clientName}</strong></p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
  });
}
