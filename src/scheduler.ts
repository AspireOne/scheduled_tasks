import { parseServerCliArgs, startServerRuntime } from "./server-runtime";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("scheduler");

async function main() {
  const { tasksDir, defaultsPath } = parseServerCliArgs(process.argv, "scheduler");

  await startServerRuntime({
    tasksDir,
    ...(defaultsPath ? { defaultsPath } : {}),
    mode: "scheduler",
    logContext: "scheduler",
    startMessage: "==================== Scheduler started ====================",
  });
}

void main().catch((err: unknown) => {
  log.error("Scheduler failed to start", err);
  process.exit(1);
});
