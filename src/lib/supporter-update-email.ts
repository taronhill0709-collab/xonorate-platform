import { sendMail } from "@/lib/email";

/** One notification email to a single supporter/subscriber about a new
 * platform-wide update. Never throws — a failed send for one recipient
 * shouldn't break the batch; callers should use Promise.allSettled and just
 * log failures. */
export async function sendSupporterUpdateEmail(options: {
  to: string;
  subject: string;
  body: string;
  siteUrl: string;
}): Promise<void> {
  const { to, subject, body, siteUrl } = options;

  await sendMail({
    to,
    subject,
    text: `${body}\n\nSee more at ${siteUrl}\n\nYou're receiving this because you signed up as a Xonorate supporter or subscribed to our newsletter.`,
    html: `<p>${body}</p><p><a href="${siteUrl}">See more at Xonorate</a></p><p style="color:#666;font-size:12px;">You're receiving this because you signed up as a Xonorate supporter or subscribed to our newsletter.</p>`,
  });
}
