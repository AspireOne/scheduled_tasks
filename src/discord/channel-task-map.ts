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
  const ambiguousChannelIds = new Set<string>();
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

    if (ambiguousChannelIds.has(task.discord_channel_id)) {
      continue;
    }

    const existing = map.get(task.discord_channel_id);
    if (existing) {
      ambiguousChannelIds.add(task.discord_channel_id);
      map.delete(task.discord_channel_id);
      log.warn(
        `Channel id ${task.discord_channel_id} is mapped to multiple tasks, so Discord replies are disabled for that channel.`,
        {
          channelId: task.discord_channel_id,
          taskNames: [existing.taskName, task.task_name],
        },
      );
      continue;
    }

    map.set(task.discord_channel_id, {
      taskName: task.task_name,
      taskPath,
    });
  }

  log.info(`Built channel→task map with ${map.size} entries from ${resolvedDir}`);
  return map;
}
