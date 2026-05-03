import type { ExtractLiterals } from "@/shared/types";
import type { AllModels, ReasoningEffort } from "openai/resources";

export const taskValues = {
  efforts: getEfforts(),
  models: getModels(),
  toolNames: ["web_search", "google_calendar", "memories"] as const,
  notificationChannels: ["discord", "log"] as const,
  webSearch: {
    searchContextSize: ["low", "medium", "high"],
    user_location: {
      type: ["approximate"],
    },
  },
} as const;

// ---

function getEfforts() {
  return [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
  ] as const satisfies readonly NonNullable<ReasoningEffort>[];
}

function getModels() {
  return [
    "gpt-5.4",
    "gpt-5.4-mini",
    //"gpt-5.5",
  ] as const satisfies readonly ExtractLiterals<AllModels>[];
}

// Enforce at compile time that efforts contains all non-null ReasoningEffort values
const _effortsExhaustiveCheck: ReturnType<typeof getEfforts>[number] =
  null as unknown as NonNullable<ReasoningEffort>;
