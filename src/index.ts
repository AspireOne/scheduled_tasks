import { buildRunHelpText, CliUsageError, printHelp, printVersion } from "./shared/cli";
import { parseCliArgs, validateCliArgsOrThrow } from "./shared/cli-parser";

process.loadEnvFile();

async function main() {
  try {
    const cliArgs = parseCliArgs(process.argv);
    if (cliArgs.help) {
      printHelp(buildRunHelpText());
      return;
    }
    if (cliArgs.version) {
      printVersion();
      return;
    }

    validateCliArgsOrThrow(cliArgs);
    const [{ globalConfig }, { run }, { validateOpenAIEnvOrThrow }, { logger, pruneLogFile }] =
      await Promise.all([
        import("./config.js"),
        import("./runner.js"),
        import("./shared/env.js"),
        import("./shared/logger.js"),
      ]);
    const log = logger.withContext("index");
    pruneLogFile(globalConfig.maxLogLines);
    log.info("==================== Run started ====================");
    log.time("run");
    log.debug("CLI args:", JSON.stringify(cliArgs));
    validateOpenAIEnvOrThrow();

    const runArgsBase = cliArgs.defaultsPath
      ? { taskPath: cliArgs.taskPath, defaultsPath: cliArgs.defaultsPath }
      : { taskPath: cliArgs.taskPath };
    const runArgs = cliArgs.continue
      ? { ...runArgsBase, continue: { message: cliArgs.message } }
      : runArgsBase;
    await run(runArgs);
    log.timeEnd("run");
    log.info("==================== Run ended ====================\n\n\n");
  } catch (err) {
    process.exitCode = err instanceof CliUsageError ? err.exitCode : 1;
    if (err instanceof CliUsageError) {
      process.stderr.write(`${err.message}\n`);
      return;
    }
    const { logger } = await import("./shared/logger.js");
    logger.withContext("index").error(err);
  }
}

// TODO: Do we need to await?
void main();
