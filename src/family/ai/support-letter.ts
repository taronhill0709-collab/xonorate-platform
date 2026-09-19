import { z } from "zod";
import { aiService } from "@/family/ai";
import {
  SUPPORT_LETTER_QUESTIONS,
  resolveQuestionLabel,
  type SupportLetterPurpose,
} from "@/family/support-letters-types";

const draftSchema = z.object({
  letter: z
    .string()
    .describe(
      "The complete letter, ready to send: salutation, body paragraphs, and a closing/signature line using the author's name. Plain text, not Markdown.",
    ),
});

const PURPOSE_CONTEXT: Record<SupportLetterPurpose, string> = {
  family: "a family support letter, written by a family member",
  character: "a character letter, written by someone who knows the person personally or professionally",
  parole: "a support letter for a parole board",
  employer: "a letter of employer support",
  community: "a letter of community support",
  faith_leader: "a letter from a faith or community leader",
  clemency: "a letter of support for a clemency application",
};

const SYSTEM = `You draft support letters for Xonorate Family — a platform helping families organize support for a loved one who is incarcerated or navigating reentry.

You will be given the author's own answers to a guided questionnaire. Those answers are the ONLY facts, relationships, experiences, accomplishments, or events you may use. This is a hard constraint:
- Never invent a detail, story, date, relationship, job, accomplishment, or outcome that isn't stated in the answers.
- Never assume something is true just because it's common in similar letters (don't assume a job offer, a stable home, or a specific family structure unless the answers say so).
- If an answer is thin or was skipped, write around it briefly and honestly rather than padding it with invented specifics.
- Write in the author's voice, first person, as if the author wrote it themselves — sincere and specific, not generic or template-sounding.
- Never promise or imply a guaranteed outcome ("this will secure your release," "you will get the job"). Never claim legal authority or make a legal argument — this is a personal letter of support, not a legal filing.
- Never fabricate a legal citation, statute, or claim about what the law requires.

Structure it as a complete, ready-to-send letter: an appropriate salutation for the stated recipient (or a generic "To Whom It May Concern" if none was given), body paragraphs organized from the author's own answers, and a closing with the author's name.`;

function buildPrompt(params: {
  purpose: SupportLetterPurpose;
  recipientName: string | null;
  lovedOneName: string;
  authorName: string;
  answers: Record<string, string>;
}): string {
  const questions = SUPPORT_LETTER_QUESTIONS[params.purpose];
  const answeredLines = questions
    .map((q) => {
      const answer = params.answers[q.key]?.trim();
      if (!answer) return null;
      return `Q: ${resolveQuestionLabel(q.label, params.lovedOneName)}\nA: ${answer}`;
    })
    .filter((line): line is string => line !== null);

  return [
    `This is ${PURPOSE_CONTEXT[params.purpose]}, in support of ${params.lovedOneName}.`,
    `The author's name (to sign the letter): ${params.authorName}`,
    params.recipientName ? `Recipient: ${params.recipientName}` : "No specific recipient named — use a generic salutation.",
    "",
    "The author's answers to the guided questions — use ONLY these facts:",
    "",
    answeredLines.length > 0 ? answeredLines.join("\n\n") : "(no answers provided yet)",
  ].join("\n");
}

export async function generateSupportLetterDraft(params: {
  purpose: SupportLetterPurpose;
  recipientName: string | null;
  lovedOneName: string;
  authorName: string;
  answers: Record<string, string>;
}): Promise<string> {
  const result = await aiService.draft({
    system: SYSTEM,
    prompt: buildPrompt(params),
    schema: draftSchema,
    effort: "medium",
    maxTokens: 1500,
  });
  return result.letter;
}
