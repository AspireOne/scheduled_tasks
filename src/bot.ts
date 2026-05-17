import { parseServerCliArgs } from "./shared/server-cli";
import { buildServerHelpText, CliUsageError, printHelp, printVersion } from "./shared/cli";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("bot");

async function main() {
  const { tasksDir, defaultsPath, help, version } = parseServerCliArgs(process.argv, "bot");
  if (help) {
    printHelp(
      buildServerHelpText({
        command: "bot",
        usage: "tsx src/bot.ts [options]",
        description: "Run only the Discord bot runtime.",
        includeMode: false,
        examples: [
          "pnpm dlx tsx src/bot.ts",
          "pnpm dlx tsx src/bot.ts --tasks tasks-examples",
          "pnpm dlx tsx src/bot.ts --tasks tasks-examples --defaults ./defaults.toml",
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
    mode: "bot",
    logContext: "bot",
    startMessage: "==================== Bot started ====================",
  });
}

void main().catch((err: unknown) => {
  if (err instanceof CliUsageError) {
    process.stderr.write(`${err.message}\n`);
    process.exit(err.exitCode);
  }
  log.error("Bot failed to start", err);
  process.exit(1);
});
