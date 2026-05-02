// The universal runner that will take in a task definition and run it.

import { readFileSync } from "node:fs";
import { parse } from "smol-toml";
import { parseCliArgs } from "./runner/cli-parser";
import { logger } from "./shared/logger";
import { formatResult } from "./shared/utils";
import { validateTask, type Task } from "./task";

const log = logger.withContext("Runner");

export function run() {
  const cliArgs = parseCliArgs(process.argv);

  const taskPath = cliArgs.values["task-path"];
  if (!taskPath) throw new Error("You must pass task path.");
  const task = getTask(taskPath);
}

function getTask(taskPath: string) {
  const taskFileContent = readFileSync(taskPath, "utf8");
  const taskJson = parse(taskFileContent);
  const taskJsonValidationResult = validateTask(taskJson as Task);

  if (!taskJsonValidationResult.success) {
    throw new Error(formatResult(taskJsonValidationResult));
  } else if (taskJsonValidationResult.warnings) {
    log.warn(formatResult(taskJsonValidationResult));
  }

  return taskJson as Task;
}

// 1. parse CLI options
// - must specify a --task {path}.toml | if not, gracefully shut down and print the message
// Validate toml config
// - must be correct toml | if not, gracefully shut down and print the message
//   - prompt must exist, must be below limit
//   - system prompt size limit
//   - model name must be one from
