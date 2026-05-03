export function validateEnvOrThrow(): void {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY env variable must be present");
  }

  if (!process.env["GOOGLE_CALENDAR_ACCESS_TOKEN"]) {
    throw new Error("GOOGLE_CALENDAR_ACCESS_TOKEN env variable must be present");
  }
}

export function getEnv() {
  return {
    OPENAI_API_KEY: process.env["OPENAI_API_KEY"]!,
    GOOGLE_CALENDAR_REFRESH_TOKEN: process.env["GOOGLE_CALENDAR_REFRESH_TOKEN"]!,
  };
}
