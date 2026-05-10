import { readFileSync } from "node:fs";
import { parse } from "smol-toml";
import type { TomlTable, TomlValue } from "smol-toml";
import { logger } from "../shared/logger";
import { formatResult } from "../shared/helpers";
import { validateTask, validateTaskDefaults } from "./task-validator";
import type { Task } from "./task.type";

const log = logger.withContext("TaskLoader");

export function loadTaskFromFile(taskPath: string, options: LoadTaskOptions = {}): Task {
  const defaults =
    options.defaults ??
    (options.defaultsPath ? loadTaskDefaultsFromFile(options.defaultsPath) : undefined);
  const taskJson = defaults
    ? mergeDefaults(defaults, parseTaskFile(taskPath))
    : parseTaskFile(taskPath);
  const taskJsonValidationResult = validateTask(taskJson);

  if (!taskJsonValidationResult.success) {
    throw new Error(formatResult(taskJsonValidationResult));
  }

  if (taskJsonValidationResult.warnings.length > 0) {
    log.warn(formatResult(taskJsonValidationResult));
  }

  return taskJson as Task;
}

type LoadTaskOptions = {
  defaults?: TomlTable;
  defaultsPath?: string;
};

function parseTaskFile(taskPath: string): TomlTable {
  return parse(readFileSync(taskPath, "utf8"));
}

export function loadTaskDefaultsFromFile(defaultsPath: string): TomlTable {
  const defaults = parseTaskFile(defaultsPath);
  const validationResult = validateTaskDefaults(defaults);

  if (!validationResult.success) {
    throw new Error(`Invalid defaults file ${defaultsPath}:\n${formatResult(validationResult)}`);
  }

  return defaults;
}

function mergeDefaults(defaults: TomlTable, task: TomlTable): TomlTable {
  const merged = cloneTomlTable(defaults);

  for (const [key, taskValue] of Object.entries(task)) {
    const defaultValue = defaults[key];
    merged[key] =
      isPlainObject(defaultValue) && isPlainObject(taskValue)
        ? mergeDefaults(defaultValue, taskValue)
        : cloneTomlValue(taskValue);
  }

  return merged;
}

function cloneTomlTable(table: TomlTable): TomlTable {
  const clone: TomlTable = {};
  for (const [key, value] of Object.entries(table)) {
    clone[key] = cloneTomlValue(value);
  }
  return clone;
}

function cloneTomlValue(value: TomlValue): TomlValue {
  if (Array.isArray(value)) {
    return value.map(cloneTomlValue);
  }

  if (isPlainObject(value)) {
    return cloneTomlTable(value);
  }

  return value;
}

function isPlainObject(value: TomlValue | undefined): value is TomlTable {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
