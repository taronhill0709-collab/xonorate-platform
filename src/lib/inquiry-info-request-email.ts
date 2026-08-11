import { sendMail } from "@/lib/email";

/** Notifies a case submitter that staff need more information before they
 * can continue reviewing their submission, with a link to the follow-up form. */
export async function sendInquiryInfoRequestEmail(options: {
  to: string;
  submitterName: string;
  personName: string;
  itemLabels: string[];
  note: string | null;
  followUpUrl: string;
}): Promise<void> {
  const { to, submitterName, personName, itemLabels, note, followUpUrl } = options;
  const itemsText = itemLabels.map((l) => `- ${l}`).join("\n");

  await sendMail({
    to,
    subject: `More information needed for ${personName}'s case`,
    text: `Hi ${submitterName},\n\nThank you for submitting ${personName}'s case to Xonorate Media. To continue reviewing it, we need the following:\n\n${itemsText}${note ? `\n\n${note}` : ""}\n\nPlease share what you can here: ${followUpUrl}\n\nThank you,\nXonorate Media`,
    html: `<p>Hi ${submitterName},</p><p>Thank you for submitting ${personName}'s case to Xonorate Media. To continue reviewing it, we need the following:</p><ul>${itemLabels.map((l) => `<li>${l}</li>`).join("")}</ul>${note ? `<p>${note}</p>` : ""}<p><a href="${followUpUrl}">Share what you can here</a></p><p>Thank you,<br/>Xonorate Media</p>`,
  });
}
