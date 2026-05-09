import { readFileSync } from "node:fs";
import { parse } from "smol-toml";
import type { TomlTable, TomlValue } from "smol-toml";
import { logger } from "../shared/logger";
import { formatResult } from "../shared/helpers";
import { validateTask } from "./task-validator";
import type { Task } from "./task.type";

const log = logger.withContext("TaskLoader");

export function loadTaskFromFile(taskPath: string, options: LoadTaskOptions = {}): Task {
  const taskJson = options.defaultsPath
    ? mergeDefaults(parseTaskFile(options.defaultsPath), parseTaskFile(taskPath))
    : parseTaskFile(taskPath);
  const taskJsonValidationResult = validateTask(taskJson as Task);

  if (!taskJsonValidationResult.success) {
    throw new Error(formatResult(taskJsonValidationResult));
  }

  if (taskJsonValidationResult.warnings.length > 0) {
    log.warn(formatResult(taskJsonValidationResult));
  }

  return taskJson as Task;
}

type LoadTaskOptions = {
  defaultsPath?: string;
};

function parseTaskFile(taskPath: string): TomlTable {
  return parse(readFileSync(taskPath, "utf8"));
}

function mergeDefaults(defaults: TomlTable, task: TomlTable): TomlTable {
  const merged: TomlTable = { ...defaults };

  for (const [key, taskValue] of Object.entries(task)) {
    const defaultValue = defaults[key];
    merged[key] =
      isPlainObject(defaultValue) && isPlainObject(taskValue)
        ? mergeDefaults(defaultValue, taskValue)
        : taskValue;
  }

  return merged;
}

function isPlainObject(value: TomlValue | undefined): value is TomlTable {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
