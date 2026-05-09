import * as path from "node:path";
import { runTaskResponse } from "./ai/response-runner";
import { buildTools } from "./ai/tools";
import { getResponseId, upsertResponseId } from "./conversations";
import { getDefaultNotificationLogFilePath } from "./notifications/log-notifier";
import { sendNotifications } from "./notifications";
import {
  validateDiscordEnvOrThrow,
  validateGoogleCalendarEnvOrThrow,
  validateMemoriesEnvOrThrow,
} from "./shared/env";
import { logger } from "./shared/logger";
import { loadTaskFromFile } from "./task";
import type { Task } from "./task/task.type";

const log = logger.withContext("runner");

export type RunArgs = {
  taskPath: string;
  defaultsPath?: string;
  continue?: { message: string };
};

export async function run(args: RunArgs) {
  const task = args.defaultsPath
    ? loadTaskFromFile(args.taskPath, { defaultsPath: args.defaultsPath })
    : loadTaskFromFile(args.taskPath);
  const taskDirectory = path.dirname(path.resolve(args.taskPath));
  log.info("Task loaded:", task.task_name);
  log.debug("Task:", task);

  validateEnvForTask(task);

  let prompt: string | undefined;
  let previousResponseId: string | undefined;

  if (args.continue) {
    previousResponseId = getResponseId(task.task_name);
    if (!previousResponseId) {
      throw new Error(
        `No prior conversation found for task "${task.task_name}". Run the task once before continuing.`,
      );
    }
    prompt = args.continue.message;
    log.info("Continuing conversation", { previousResponseId });
  }

  await executeAndNotify({ task, taskDirectory, prompt, previousResponseId });
}

async function executeAndNotify(props: {
  task: Task;
  taskDirectory: string;
  prompt: string | undefined;
  previousResponseId: string | undefined;
}) {
  const { task, taskDirectory, prompt, previousResponseId } = props;

  const tools = buildTools({
    toolNames: task.tool_names,
    webSearchConfig: task.web_search,
  });

  log.time("openai_response");
  const response = await runTaskResponse({ task, tools, prompt, previousResponseId });
  log.timeEnd("openai_response");

  const usage = response.usage;
  log.info("OpenAI response usage", {
    total: usage?.total_tokens,
    input: usage?.input_tokens,
    output: usage?.output_tokens,
    reasoning: usage?.output_tokens_details?.reasoning_tokens,
    cachedInput: usage?.input_tokens_details?.cached_tokens,
  });

  try {
    upsertResponseId(task.task_name, response.id);
    log.debug("Persisted response id", { taskName: task.task_name, responseId: response.id });
  } catch (err) {
    log.error("Failed to persist response id; run will continue", err);
  }

  log.time("notifications");
  await sendNotifications({
    channels: task.notification_channels,
    discordChannelId: task.discord_channel_id,
    logFilePath: getNotificationLogFilePath({
      taskDirectory,
      taskName: task.task_name,
      configuredPath: task.notifications?.log?.file_path,
    }),
    payload: {
      taskName: task.task_name,
      content: response.output_text,
    },
  });
  log.timeEnd("notifications");
}

function validateEnvForTask(task: Task) {
  if (task.notification_channels.includes("discord")) {
    validateDiscordEnvOrThrow();
  }

  if (task.tool_names.includes("google_calendar")) {
    validateGoogleCalendarEnvOrThrow();
  }

  if (task.tool_names.includes("memories")) {
    validateMemoriesEnvOrThrow();
  }
}

function getNotificationLogFilePath(params: {
  taskDirectory: string;
  taskName: string;
  configuredPath: string | undefined;
}): string {
  if (params.configuredPath) {
    return path.resolve(params.taskDirectory, params.configuredPath);
  }

  return getDefaultNotificationLogFilePath({
    taskDirectory: params.taskDirectory,
    taskName: params.taskName,
  });
}
