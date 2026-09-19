import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AIRefusalError, type AIService } from "./ai-service";

// claude-opus-5 by default — Family's AI tools are drafting assistance a
// user reads and edits, not a real-time chat reply someone is staring at a
// spinner for (ask-xonorate.ts uses sonnet-5 specifically for that
// latency reason). Quality of the actual prose matters more here, same
// reasoning as impact-pipeline.ts's draftImpactNarrative.
const DEFAULT_MODEL = "claude-opus-5";

export const anthropicAIService: AIService = {
  async draft({ system, prompt, schema, model = DEFAULT_MODEL, effort = "medium", maxTokens = 2000 }) {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model,
      max_tokens: maxTokens,
      system,
      output_config: { effort, format: zodOutputFormat(schema) },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new AIRefusalError("The AI declined to generate this content.");
    }
    if (!response.parsed_output) {
      throw new Error("The AI did not return structured output.");
    }
    return response.parsed_output;
  },
};
