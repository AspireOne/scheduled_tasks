import { run } from "./runner";
import { logger } from "./shared/logger";

const log = logger.withContext("index");

log.info("\n\n====================\n\nRun started");

try {
  run();
} catch (err) {
  log.error(err);
}

log.info("\n\nRun ended");
