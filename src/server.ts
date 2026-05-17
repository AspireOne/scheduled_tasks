import { parseServerCliArgs } from "./shared/server-cli";
import { buildServerHelpText, CliUsageError, printHelp, printVersion } from "./shared/cli";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("server");

async function main() {
  const { tasksDir, defaultsPath, mode, help, version } = parseServerCliArgs(process.argv, "all");
  if (help) {
    printHelp(
      buildServerHelpText({
        command: "server",
        usage: "tsx src/server.ts [options]",
        description: "Run the combined scheduler and Discord bot runtime.",
        includeMode: true,
        examples: [
          "pnpm dlx tsx src/server.ts",
          "pnpm dlx tsx src/server.ts --mode scheduler",
          "pnpm dlx tsx src/server.ts --tasks tasks-examples --defaults ./defaults.toml",
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
    mode,
    logContext: "server",
    startMessage: "==================== Server started ====================",
  });
}

void main().catch((err: unknown) => {
  if (err instanceof CliUsageError) {
    process.stderr.write(`${err.message}\n`);
    process.exit(err.exitCode);
  }
  log.error("Server failed to start", err);
  process.exit(1);
});
