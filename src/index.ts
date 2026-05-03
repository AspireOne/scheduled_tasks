import { globalConfig } from "./config";
import { run, type RunArgs } from "./runner";
import { parseCliArgs, validateCliArgsOrThrow } from "./shared/cli-parser";
import { validateOpenAIEnvOrThrow } from "./shared/env";
import { logger, pruneLogFile } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("index");

async function main() {
  pruneLogFile(globalConfig.maxLogLines);
  log.info("==================== Run started ====================");
  log.time("run");

  try {
    validateOpenAIEnvOrThrow();

    const cliArgs = parseCliArgs(process.argv);
    log.debug("CLI args:", JSON.stringify(cliArgs));
    validateCliArgsOrThrow(cliArgs);

    const runArgs: RunArgs = cliArgs.continue
      ? { taskPath: cliArgs.taskPath, continue: { message: cliArgs.message } }
      : { taskPath: cliArgs.taskPath };
    await run(runArgs);
  } catch (err) {
    log.error(err);
  }

  log.timeEnd("run");
  log.info("==================== Run ended ====================\n\n\n");
}

// TODO: Do we need to await?
void main();
