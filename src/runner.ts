import { openai } from "./ai/openai-client";
import { buildTools } from "./ai/tools";
import { type CliArgsValidated } from "./shared/cli-parser";
import { getGoogleCalendarAccessToken } from "./shared/google-calendar-auth";
import { logger } from "./shared/logger";
import { loadTaskFromFile } from "./task";

const log = logger.withContext("runner");

export async function run(cliArgs: CliArgsValidated) {
  const task = loadTaskFromFile(cliArgs.taskPath);
  const googleCalendarAccessToken = task.tool_names.includes("google_calendar")
    ? await getGoogleCalendarAccessToken()
    : undefined;

  const tools = buildTools({
    toolNames: task.tool_names,
    webSearchConfig: task.web_search,
    ...(googleCalendarAccessToken ? { googleCalendarAccessToken } : {}),
  });

  const response = await openai.responses.create({
    model: task.model,
    instructions: task.system_prompt || null,
    input: task.prompt,
    tools: tools,
    reasoning: { effort: task.effort },
    prompt_cache_retention: "in_memory",
    parallel_tool_calls: true,
    truncation: "auto",
    // temperature: 0.8 // TODO: Check if this is supported for reasoning models
  });

  log.info("Response:", response.output_text);
}
