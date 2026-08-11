import { sendMail } from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";

/** Emails ADMIN_NOTIFICATION_EMAIL about a new submission, or logs to the
 * console if it isn't set — same fallback the content pipeline uses, so a
 * missing env var never blocks the submission itself. */
async function notifyAdmin(subject: string, text: string, html: string, logLabel: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.log(`[admin-notify] ${logLabel} — set ADMIN_NOTIFICATION_EMAIL to get notified.`);
    return;
  }

  await sendMail({ to: adminEmail, subject, text, html });
}

export async function notifyAdminOfCaseSubmission(options: {
  personName: string;
  submitterName: string;
  submitterEmail: string;
  state: string;
  caseSummary: string;
}): Promise<void> {
  const { personName, submitterName, submitterEmail, state, caseSummary } = options;
  const reviewUrl = `${getSiteOrigin()}/admin/case-submissions`;

  await notifyAdmin(
    `New case submission: ${personName}`,
    `${submitterName} (${submitterEmail}) submitted a case for ${personName} (${state}).\n\n${caseSummary}\n\nReview it here: ${reviewUrl}`,
    `<p><strong>${submitterName}</strong> (${submitterEmail}) submitted a case for <strong>${personName}</strong> (${state}).</p><p>${caseSummary}</p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
    `New case submission from ${submitterName} for ${personName}`,
  );
}

export async function notifyAdminOfGeneralInquiry(options: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const { name, email, message } = options;
  const reviewUrl = `${getSiteOrigin()}/admin/inquiries`;

  await notifyAdmin(
    `New inquiry: ${name}`,
    `${name} (${email}) sent an inquiry:\n\n${message}\n\nReply to it here: ${reviewUrl}`,
    `<p><strong>${name}</strong> (${email}) sent an inquiry:</p><p>${message}</p><p><a href="${reviewUrl}">${reviewUrl}</a></p>`,
    `New inquiry from ${name}`,
  );
}
