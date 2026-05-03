import { openai } from "./ai/openai-client";
import { getTools as buildTools } from "./ai/tools";
import { type CliArgsValidated } from "./shared/cli-parser";
import { logger } from "./shared/logger";
import { loadTaskFromFile } from "./task";

const log = logger.withContext("runner");

export async function run(cliArgs: CliArgsValidated) {
  const task = loadTaskFromFile(cliArgs.taskPath);
  const tools = buildTools({ toolNames: task.tool_names, webSearchConfig: task.web_search });

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
}
