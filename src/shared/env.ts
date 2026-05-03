export function validateOpenAIEnvOrThrow(): void {
  assertExistsOrThrow("OPENAI_API_KEY");
}

export function validateGoogleCalendarEnvOrThrow(): void {
  assertExistsOrThrow("GOOGLE_CALENDAR_REFRESH_TOKEN");
  assertExistsOrThrow("GOOGLE_CALENDAR_CLIENT_ID");
  assertExistsOrThrow("GOOGLE_CALENDAR_CLIENT_SECRET");
}

export function validateMemoriesEnvOrThrow(): void {
  assertExistsOrThrow("MEMORIES_MCP_API_KEY");
}

export function validateDiscordEnvOrThrow(): void {
  assertExistsOrThrow("DISCORD_BOT_TOKEN");
}

function assertExistsOrThrow(envKey: string): void {
  if (!process.env[envKey]) {
    throw new Error(`${envKey} env variable must be present.`);
  }
}

export function getEnv() {
  return {
    OPENAI_API_KEY: process.env["OPENAI_API_KEY"]!,
    GOOGLE_CALENDAR_REFRESH_TOKEN: process.env["GOOGLE_CALENDAR_REFRESH_TOKEN"]!,
    GOOGLE_CALENDAR_CLIENT_ID: process.env["GOOGLE_CALENDAR_CLIENT_ID"]!,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]!,
    MEMORIES_MCP_API_KEY: process.env["MEMORIES_MCP_API_KEY"]!,
    DISCORD_BOT_TOKEN: process.env["DISCORD_BOT_TOKEN"]!,
  };
}
