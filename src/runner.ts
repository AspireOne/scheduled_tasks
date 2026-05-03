import * as path from "node:path";
import { runTaskResponse } from "./ai/response-runner";
import { buildTools } from "./ai/tools";
import { getDefaultNotificationLogFilePath } from "./notifications/log-notifier";
import { sendNotifications } from "./notifications";
import { type CliArgsValidated } from "./shared/cli-parser";
import {
  getEnv,
  validateDiscordEnvOrThrow,
  validateGoogleCalendarEnvOrThrow,
  validateMemoriesEnvOrThrow,
} from "./shared/env";
import { logger } from "./shared/logger";
import { loadTaskFromFile } from "./task";

const log = logger.withContext("runner");

export async function run(cliArgs: CliArgsValidated) {
  const task = loadTaskFromFile(cliArgs.taskPath);
  const taskDirectory = path.dirname(path.resolve(cliArgs.taskPath));
  log.info("Task loaded:", task.task_name);
  log.debug("Task:", task);

  if (task.notification_channels.includes("discord") && !task.discord_webhook_url) {
    validateDiscordEnvOrThrow();
  }

  if (task.tool_names.includes("google_calendar")) {
    validateGoogleCalendarEnvOrThrow();
  }

  if (task.tool_names.includes("memories")) {
    validateMemoriesEnvOrThrow();
  }

  const tools = buildTools({
    toolNames: task.tool_names,
    webSearchConfig: task.web_search,
  });

  log.time("openai_response");
  const response = await runTaskResponse({
    task,
    tools,
  });
  log.timeEnd("openai_response");

  const usage = response.usage;
  log.info("OpenAI response usage", {
    total: usage?.total_tokens,
    input: usage?.input_tokens,
    output: usage?.output_tokens,
    reasoning: usage?.output_tokens_details?.reasoning_tokens,
    cachedInput: usage?.input_tokens_details?.cached_tokens,
  });

  log.time("notifications");
  await sendNotifications({
    channels: task.notification_channels,
    discordWebhokUrl: task.discord_webhook_url || getEnv().DISCORD_WEBHOOK_URL,
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
