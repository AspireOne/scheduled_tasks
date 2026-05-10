import { loadTasksFromDirectory } from "@/task";
import { logger } from "@/shared/logger";

const log = logger.withContext("discord-channel-task-map");

export type ChannelTaskMap = Map<
  string,
  { taskName: string; taskPath: string; defaultsPath?: string }
>;

export function buildChannelTaskMap(
  tasksDir: string,
  options?: BuildChannelTaskMapOptions,
): ChannelTaskMap {
  const map: ChannelTaskMap = new Map();
  const ambiguousChannelIds = new Set<string>();

  for (const { task, taskPath, defaultsPath } of loadTasksFromDirectory(tasksDir, options)) {
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

    const channelTask = {
      taskName: task.task_name,
      taskPath,
      ...(defaultsPath ? { defaultsPath } : {}),
    };
    map.set(task.discord_channel_id, channelTask);
  }

  log.info(`Built channel→task map with ${map.size} entries from ${tasksDir}`);
  return map;
}

type BuildChannelTaskMapOptions = {
  defaultsPath?: string;
};
