export function validateEnvOrThrow(): void {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY env variable must be present");
  }

  if (!process.env["GOOGLE_CALENDAR_REFRESH_TOKEN"]) {
    throw new Error("GOOGLE_CALENDAR_REFRESH_TOKEN env variable must be present");
  }

  if (!process.env["GOOGLE_CALENDAR_CLIENT_ID"]) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_ID env variable must be present");
  }

  if (!process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_SECRET env variable must be present");
  }

  if (!process.env["MEMORIES_MCP_API_KEY"]) {
    throw new Error("MEMORIES_MCP_API_KEY env variable must be present");
  }
}

export function validateDiscordEnvOrThrow(): void {
  if (!process.env["DISCORD_WEBHOOK_URL"]) {
    throw new Error("DISCORD_WEBHOOK_URL env variable must be present");
  }
}

export function getEnv() {
  return {
    OPENAI_API_KEY: process.env["OPENAI_API_KEY"]!,
    GOOGLE_CALENDAR_REFRESH_TOKEN: process.env["GOOGLE_CALENDAR_REFRESH_TOKEN"]!,
    GOOGLE_CALENDAR_CLIENT_ID: process.env["GOOGLE_CALENDAR_CLIENT_ID"]!,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]!,
    MEMORIES_MCP_API_KEY: process.env["MEMORIES_MCP_API_KEY"]!,
    DISCORD_WEBHOOK_URL: process.env["DISCORD_WEBHOOK_URL"]!,
  };
}
