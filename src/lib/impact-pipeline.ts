import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ImpactFacts } from "@/lib/case-impact";

const impactDraftSchema = z.object({
  familyImpact: z.string(),
  communityImpact: z.string(),
});

const SYSTEM = `You write the "human cost" section of a wrongful-conviction case page for Xonorate Media Platform.

You'll be given a client's name and a list of facts about their family and community circumstances at the time of their arrest. Those facts are ground truth — write two short paragraphs, one on the impact to their family and one on the impact to their community, using ONLY the facts given. Never invent a name, relationship, age, event, or outcome that isn't stated, and never assume a detail just because it's common in similar cases (don't assume financial hardship, a lost job, or a strained marriage unless a fact says so).

Requirements:
- 2-4 sentences per paragraph, grounded and factual — not sensationalized, no purple prose.
- If the family facts given are too thin to support a real paragraph, do not pad it with generic statements — return an empty string for familyImpact instead. Apply the same rule to communityImpact.
- Write in plain prose, not a list.`;

function factsToBullets(facts: ImpactFacts): { family: string[]; community: string[] } {
  const family: string[] = [];
  if (facts.ageAtArrest != null) family.push(`Age at arrest: ${facts.ageAtArrest}`);
  if (facts.maritalStatus) family.push(`Marital status at arrest: ${facts.maritalStatus}`);
  if (facts.numberOfChildren != null) family.push(`Number of children: ${facts.numberOfChildren}`);
  if (facts.childrenAgesAtArrest)
    family.push(`Children's ages at arrest: ${facts.childrenAgesAtArrest}`);
  if (facts.primaryCaregiver)
    family.push("Was the primary income earner or caregiver for their family");
  if (facts.occupationAtArrest) family.push(`Occupation at arrest: ${facts.occupationAtArrest}`);
  family.push(...facts.additionalFamilyFacts);

  const community: string[] = [];
  if (facts.communityRole)
    community.push(`Role in the community before arrest: ${facts.communityRole}`);
  if (facts.actualPerpetratorOutcome)
    community.push(`What happened to the actual perpetrator: ${facts.actualPerpetratorOutcome}`);
  community.push(...facts.additionalCommunityFacts);

  return { family, community };
}

export async function draftImpactNarrative(
  clientName: string,
  facts: ImpactFacts,
): Promise<{ familyImpact: string; communityImpact: string }> {
  const { family, community } = factsToBullets(facts);

  if (family.length === 0 && community.length === 0) {
    return { familyImpact: "", communityImpact: "" };
  }

  const userPrompt = `Client: ${clientName}

Family facts:
${family.length > 0 ? family.map((f) => `- ${f}`).join("\n") : "(none given)"}

Community facts:
${community.length > 0 ? community.map((f) => `- ${f}`).join("\n") : "(none given)"}`;

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1500,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(impactDraftSchema),
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to generate this impact narrative.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude did not return a structured impact draft.");
  }
  return response.parsed_output;
}
