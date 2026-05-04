import { parseServerCliArgs, startServerRuntime } from "./server-runtime";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("bot");

async function main() {
  const { tasksDir } = parseServerCliArgs(process.argv, "bot");

  await startServerRuntime({
    tasksDir,
    mode: "bot",
    logContext: "bot",
    startMessage: "==================== Bot started ====================",
  });
}

void main().catch((err: unknown) => {
  log.error("Bot failed to start", err);
  process.exit(1);
});
