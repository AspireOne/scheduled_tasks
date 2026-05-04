import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "@/shared/logger";
import { loadTaskFromFile } from "./task-loader";
import type { Task } from "./task.type";

const log = logger.withContext("task-directory");

export type LoadedTaskFile = {
  task: Task;
  taskPath: string;
};

export function loadTasksFromDirectory(tasksDir: string): LoadedTaskFile[] {
  const resolvedDir = path.resolve(tasksDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Tasks directory does not exist: ${resolvedDir}`);
  }

  const taskFiles: LoadedTaskFile[] = [];
  const entries = fs.readdirSync(resolvedDir);

  for (const entry of entries) {
    if (!entry.endsWith(".toml")) continue;

    const taskPath = path.join(resolvedDir, entry);

    try {
      taskFiles.push({
        task: loadTaskFromFile(taskPath),
        taskPath,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log.warn(`Skipping invalid task file ${taskPath}: ${reason}`);
    }
  }

  log.info(`Loaded ${taskFiles.length} valid task file(s) from ${resolvedDir}`);
  return taskFiles;
}
