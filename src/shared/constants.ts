import type { AllModels, ReasoningEffort } from "openai/resources";
import type { ExtractLiterals } from "./types";

const efforts = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const satisfies readonly NonNullable<ReasoningEffort>[];

const models = ["gpt-5.4", "gpt-5.4-mini"] as const satisfies readonly ExtractLiterals<AllModels>[];

export const taskConfigValues = {
  efforts,
  models,
  toolNames: ["web_search", "google_calendar", "memories"] as const,
  notificationChannels: ["discord", "log"] as const,
} as const;

// Enforce at compile time that efforts contains all non-null ReasoningEffort values
const _effortsExhaustiveCheck: (typeof efforts)[number] =
  null as unknown as NonNullable<ReasoningEffort>;

export type Effort = (typeof taskConfigValues.efforts)[number];
export type KnownModel = (typeof taskConfigValues.models)[number];
export type ToolName = (typeof taskConfigValues.toolNames)[number];
export type NotificationChannel = (typeof taskConfigValues.notificationChannels)[number];
