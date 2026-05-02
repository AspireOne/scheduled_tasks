import { run } from "./runner";
import { parseCliArgs, validateCliArgsOrThrow } from "./shared/cli-parser";
import { validateEnvOrThrow } from "./shared/env";
import { logger } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("index");

async function main() {
  log.info("==================== Run started");

  try {
    validateEnvOrThrow();

    const cliArgs = parseCliArgs(process.argv);
    log.debug("CLI args:", JSON.stringify(cliArgs));
    validateCliArgsOrThrow(cliArgs);

    await run(cliArgs);
  } catch (err) {
    log.error(err);
  }

  log.info("=================== Run ended");
}

// TODO: Do we need to await?
void main();
