import type { ResponseCreateParamsBase } from "openai/resources/responses/responses.js";

export function augmentWithCurrentDate(prompt: string) {
  const currentTime = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${prompt}\n\n\nDnes je ${currentTime}`;
}

export function getPromptCacheRetention(
  model: string,
): NonNullable<ResponseCreateParamsBase["prompt_cache_retention"]> {
  return model.startsWith("gpt-5.5") ? "24h" : "in_memory";
}
