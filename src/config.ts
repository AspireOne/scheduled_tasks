import path from "path";

export const globalConfig = {
  openaiTimeoutMs: 25 * 60 * 1000, // 25 minutes
  maxLogLines: 10_000,
  logFilePath: path.resolve("logs.log"),
};
