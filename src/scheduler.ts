import { parseServerCliArgs, startServerRuntime } from "./server-runtime";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("scheduler");

async function main() {
  const { tasksDir } = parseServerCliArgs(process.argv, "scheduler");

  await startServerRuntime({
    tasksDir,
    mode: "scheduler",
    logContext: "scheduler",
    startMessage: "==================== Scheduler started ====================",
  });
}

void main().catch((err: unknown) => {
  log.error("Scheduler failed to start", err);
  process.exit(1);
});
