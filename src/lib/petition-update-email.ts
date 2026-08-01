import { sendMail } from "@/lib/email";

/** One notification email to a single verified signer about a new petition
 * update. Never throws — a failed send for one signer shouldn't break the
 * batch; callers should use Promise.allSettled and just log failures. */
export async function sendPetitionUpdateEmail(options: {
  to: string;
  displayName: string;
  petitionTitle: string;
  petitionUrl: string;
  updateTitle: string;
  updateBody: string;
}): Promise<void> {
  const { to, displayName, petitionTitle, petitionUrl, updateTitle, updateBody } = options;

  await sendMail({
    to,
    subject: `Update on "${petitionTitle}"`,
    text: `Hi ${displayName},\n\nThere's a new update on the petition you signed, "${petitionTitle}":\n\n${updateTitle}\n\n${updateBody}\n\nSee the full petition and its progress: ${petitionUrl}\n\nYou're receiving this because you signed this petition on Xonorate Media Platform.`,
    html: `<p>Hi ${displayName},</p><p>There's a new update on the petition you signed, <strong>${petitionTitle}</strong>:</p><p><strong>${updateTitle}</strong></p><p>${updateBody}</p><p><a href="${petitionUrl}">See the full petition and its progress</a></p><p style="color:#666;font-size:12px;">You're receiving this because you signed this petition on Xonorate Media Platform.</p>`,
  });
}
