import { Resend } from "resend";

const FROM =
  process.env.EMAIL_FROM ??
  "Xonorate Media Platform <no-reply@xonorate.com>";

/**
 * Sends transactional email via Resend. Without RESEND_API_KEY (e.g. local
 * dev without the key configured), logs the message to the server console
 * instead of sending — lets the confirmation-link flow be tested end to end
 * without a real inbox.
 */
export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[dev email fallback] To: ${options.to}\nSubject: ${options.subject}\n\n${options.text}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
