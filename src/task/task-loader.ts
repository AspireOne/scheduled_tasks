import { readFileSync } from "node:fs";
import { parse } from "smol-toml";
import { logger } from "../shared/logger";
import { formatResult } from "../shared/utils";
import { validateTask } from "./task-validator";
import type { Task } from "./task";

const log = logger.withContext("TaskLoader");

export function loadTaskFromFile(taskPath: string): Task {
  const taskFileContent = readFileSync(taskPath, "utf8");
  const taskJson = parse(taskFileContent);
  const taskJsonValidationResult = validateTask(taskJson as Task);

  if (!taskJsonValidationResult.success) {
    throw new Error(formatResult(taskJsonValidationResult));
  }

  if (taskJsonValidationResult.warnings.length > 0) {
    log.warn(formatResult(taskJsonValidationResult));
  }

  return taskJson as Task;
}
