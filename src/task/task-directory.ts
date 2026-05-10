import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "@/shared/logger";
import { resolveTaskDefaultsPath, taskDefaultsFileName } from "./task-defaults";
import { loadTaskDefaultsFromFile, loadTaskFromFile } from "./task-loader";
import type { Task } from "./task.type";

const log = logger.withContext("task-directory");

export type LoadedTaskFile = {
  task: Task;
  taskPath: string;
  defaultsPath?: string;
};

export function loadTasksFromDirectory(
  tasksDir: string,
  options: LoadTasksFromDirectoryOptions = {},
): LoadedTaskFile[] {
  const resolvedDir = path.resolve(tasksDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Tasks directory does not exist: ${resolvedDir}`);
  }

  const defaultsPath = resolveTaskDefaultsPath({ tasksDir: resolvedDir, ...options });
  const defaults = defaultsPath ? loadTaskDefaultsFromFile(defaultsPath) : undefined;
  const taskFiles: LoadedTaskFile[] = [];
  const entries = fs.readdirSync(resolvedDir);

  for (const entry of entries) {
    if (!entry.endsWith(".toml")) continue;
    if (entry === taskDefaultsFileName) continue;

    const taskPath = path.join(resolvedDir, entry);
    if (defaultsPath === path.resolve(taskPath)) continue;

    try {
      const task =
        defaultsPath && defaults
          ? loadTaskFromFile(taskPath, { defaults, defaultsPath })
          : loadTaskFromFile(taskPath);
      const loadedTaskFile: LoadedTaskFile = {
        task,
        taskPath,
      };
      if (defaultsPath) {
        loadedTaskFile.defaultsPath = defaultsPath;
      }
      taskFiles.push(loadedTaskFile);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log.warn(`Skipping invalid task file ${taskPath}: ${reason}`);
    }
  }

  log.info(`Loaded ${taskFiles.length} valid task file(s) from ${resolvedDir}`);
  return taskFiles;
}

type LoadTasksFromDirectoryOptions = {
  defaultsPath?: string;
};
