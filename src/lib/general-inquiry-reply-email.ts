import { sendMail } from "@/lib/email";

/** Sends the admin's reply to a general-inquiry submitter as an email,
 * quoting their original message for context. */
export async function sendGeneralInquiryReplyEmail(options: {
  to: string;
  name: string;
  originalMessage: string;
  reply: string;
}): Promise<void> {
  const { to, name, originalMessage, reply } = options;

  await sendMail({
    to,
    subject: "Re: Your message to Xonorate",
    text: `Hi ${name},\n\n${reply}\n\n---\nYour original message:\n${originalMessage}`,
    html: `<p>Hi ${name},</p><p>${reply}</p><hr /><p style="color:#666;font-size:12px;">Your original message:</p><p style="color:#666;font-size:12px;">${originalMessage}</p>`,
  });
}
