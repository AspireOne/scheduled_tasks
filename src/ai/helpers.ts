import type { ResponseCreateParamsBase } from "openai/resources/responses/responses.js";

/*  Currently only adds current time */
export function augmentSystemPromptWithMetadata(prompt: string) {
  const currentTime = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const prefix = `\n\n---\n\nMetadata:\n`;
  const data = `Datetime: ${currentTime}.`;

  return prompt ? `${prompt}${prefix}${data}.` : `Datetime: ${currentTime}.`;
}

export function getPromptCacheRetention(
  model: string,
): NonNullable<ResponseCreateParamsBase["prompt_cache_retention"]> {
  return model.startsWith("gpt-5.5") ? "24h" : "in_memory";
}
