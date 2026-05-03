import { runTaskResponse } from "./ai/response-runner";
import { buildTools } from "./ai/tools";
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

  log.time("notifications");
  await sendNotifications({
    channels: task.notification_channels,
    discordWebhokUrl: task.discord_webhook_url || getEnv().DISCORD_WEBHOOK_URL,
    payload: {
      taskName: task.task_name,
      content: response.output_text,
    },
  });
  log.timeEnd("notifications");
}
