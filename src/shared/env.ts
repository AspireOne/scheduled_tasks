export function validateEnvOrThrow(): void {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY env variable must be present");
  }
}

export function getEnv() {
  return {
    OPENAI_API_KEY: process.env["OPENAI_API_KEY"]!,
  };
}
