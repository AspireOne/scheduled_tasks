import * as fs from "node:fs";
import * as path from "node:path";
import { loadTaskFromFile } from "@/task";
import { logger } from "@/shared/logger";

const log = logger.withContext("discord-channel-task-map");

export type ChannelTaskMap = Map<string, { taskName: string; taskPath: string }>;

export function buildChannelTaskMap(tasksDir: string): ChannelTaskMap {
  const resolvedDir = path.resolve(tasksDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Tasks directory does not exist: ${resolvedDir}`);
  }

  const map: ChannelTaskMap = new Map();
  const entries = fs.readdirSync(resolvedDir);

  for (const entry of entries) {
    if (!entry.endsWith(".toml")) continue;
    const taskPath = path.join(resolvedDir, entry);

    let task;
    try {
      task = loadTaskFromFile(taskPath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log.warn(`Skipping invalid task file ${taskPath}: ${reason}`);
      continue;
    }

    if (!task.discord_channel_id) continue;

    const existing = map.get(task.discord_channel_id);
    if (existing) {
      throw new Error(
        `Channel id ${task.discord_channel_id} is mapped to multiple tasks: "${existing.taskName}" and "${task.task_name}". Each Discord channel must serve a single task.`,
      );
    }

    map.set(task.discord_channel_id, {
      taskName: task.task_name,
      taskPath,
    });
  }

  log.info(`Built channel→task map with ${map.size} entries from ${resolvedDir}`);
  return map;
}
