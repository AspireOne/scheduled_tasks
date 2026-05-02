export const constants = {
  efforts: ["low", "medium", "high", "xhigh"] as const,
  knownModels: ["gpt-5.4", "gpt-5.5", "gpt-5.4-mini"] as const,
  tools: ["web_search", "google_calendar", "memories"] as const,
  notificationChannels: ["discord", "log"] as const,
} as const;