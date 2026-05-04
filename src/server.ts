import { startServerRuntime, parseServerCliArgs } from "./server-runtime";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("server");

async function main() {
  const { tasksDir, mode } = parseServerCliArgs(process.argv, "all");

  await startServerRuntime({
    tasksDir,
    mode,
    logContext: "server",
    startMessage: "==================== Server started ====================",
  });
}

void main().catch((err: unknown) => {
  log.error("Server failed to start", err);
  process.exit(1);
});
