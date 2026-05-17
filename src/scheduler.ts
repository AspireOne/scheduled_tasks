import { parseServerCliArgs } from "./shared/server-cli";
import { buildServerHelpText, CliUsageError, printHelp, printVersion } from "./shared/cli";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("scheduler");

async function main() {
  const { tasksDir, defaultsPath, help, version } = parseServerCliArgs(process.argv, "scheduler");
  if (help) {
    printHelp(
      buildServerHelpText({
        command: "scheduler",
        usage: "tsx src/scheduler.ts [options]",
        description: "Run only the cron scheduler runtime.",
        includeMode: false,
        examples: [
          "pnpm dlx tsx src/scheduler.ts",
          "pnpm dlx tsx src/scheduler.ts --tasks tasks-examples",
          "pnpm dlx tsx src/scheduler.ts --tasks tasks-examples --defaults ./defaults.toml",
        ],
      }),
    );
    return;
  }
  if (version) {
    printVersion();
    return;
  }

  const { startServerRuntime } = await import("./server-runtime.js");
  await startServerRuntime({
    tasksDir,
    ...(defaultsPath ? { defaultsPath } : {}),
    mode: "scheduler",
    logContext: "scheduler",
    startMessage: "==================== Scheduler started ====================",
  });
}

void main().catch((err: unknown) => {
  if (err instanceof CliUsageError) {
    process.stderr.write(`${err.message}\n`);
    process.exit(err.exitCode);
  }
  log.error("Scheduler failed to start", err);
  process.exit(1);
});
