import type { Tool } from "openai/resources/responses/responses.js";
import { augmentWithCurrentDate } from "./ai/helpers";
import { openai } from "./ai/openai-client";
import { buildTools } from "./ai/tools";
import { sendNotifications } from "./notifications";
import { type CliArgsValidated } from "./shared/cli-parser";
import { getEnv, validateDiscordEnvOrThrow } from "./shared/env";
import { getGoogleCalendarAccessToken } from "./shared/google-calendar-auth";
import { logger } from "./shared/logger";
import { loadTaskFromFile, type Task } from "./task";

const log = logger.withContext("runner");

export async function run(cliArgs: CliArgsValidated) {
  const task = loadTaskFromFile(cliArgs.taskPath);
  log.info("Task loaded:", task.task_name);
  log.debug("Task:", task);

  if (task.notification_channels.includes("discord") && !task.discord_webhook_url) {
    validateDiscordEnvOrThrow();
  }

  log.time("google_calendar_access_token");
  const googleCalendarAccessToken = task.tool_names.includes("google_calendar")
    ? await getGoogleCalendarAccessToken()
    : undefined;
  log.timeEnd("google_calendar_access_token");

  const tools = buildTools({
    toolNames: task.tool_names,
    webSearchConfig: task.web_search,
    ...(googleCalendarAccessToken ? { googleCalendarAccessToken } : {}),
  });

  log.time("openai_response");
  const response = await performAiRequest(task, tools);
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

async function performAiRequest(task: Task, tools: Tool[]) {
  return await openai.responses.create({
    model: task.model,
    instructions: task.system_prompt ? augmentWithCurrentDate(task.system_prompt) : null,
    input: task.prompt,
    tools: tools,
    reasoning: { effort: task.effort },
    prompt_cache_retention: "in_memory",
    parallel_tool_calls: true,
    truncation: "auto",
    stream: false,
  });
}
