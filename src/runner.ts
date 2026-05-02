import { parseCliArgs } from "./runner/cli-parser";
import { logger } from "./shared/logger";
import { loadTaskFromFile } from "./task";

const log = logger.withContext("runner");

export function run() {
  const cliArgs = parseCliArgs(process.argv);
  log.debug("CLI args:", JSON.stringify(cliArgs));

  const taskPath = cliArgs.taskPath;
  if (!taskPath) throw new Error("You must pass task path.");

  const task = loadTaskFromFile(taskPath);
}

// 1. parse CLI options
// - must specify a --task {path}.toml | if not, gracefully shut down and print the message
// Validate toml config
// - must be correct toml | if not, gracefully shut down and print the message
//   - prompt must exist, must be below limit
//   - system prompt size limit
//   - model name must be one from
