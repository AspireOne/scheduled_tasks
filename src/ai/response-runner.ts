import type { Task } from "@/task/task.type";
import { logger } from "@/shared/logger";
import type {
  Response,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { augmentWithCurrentDate } from "./helpers";
import { openai } from "./openai-client";
import type { BuiltTools } from "./tools";

const log = logger.withContext("ai-response-runner");

const MAX_RESPONSE_ROUNDS = 50;

export async function runTaskResponse(props: {
  task: Task;
  tools: BuiltTools;
  prompt?: string | undefined;
  previousResponseId?: string | undefined;
}): Promise<Response> {
  const instructions = props.task.system_prompt
    ? augmentWithCurrentDate(props.task.system_prompt)
    : null;

  let previousResponseId: string | undefined = props.previousResponseId;
  let input: string | ResponseInputItem[] = props.prompt ?? props.task.prompt;

  for (let round = 1; round <= MAX_RESPONSE_ROUNDS; round += 1) {
    log.debug("Creating OpenAI response", {
      hasPreviousResponseId: previousResponseId !== undefined,
      round,
    });

    const response = await openai.responses.create({
      model: props.task.model,
      instructions,
      input,
      tools: props.tools.tools,
      reasoning: { effort: props.task.effort },
      prompt_cache_retention: "in_memory",
      parallel_tool_calls: false,
      truncation: "auto",
      stream: false,
      ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    });

    const localFunctionCalls = response.output.filter(isLocalFunctionCall);

    if (localFunctionCalls.length === 0) {
      return response;
    }

    log.info(
      "Executing local function tools",
      localFunctionCalls.map((call) => call.name),
    );

    input = await executeLocalFunctionCalls(localFunctionCalls, props.tools.localFunctionHandlers);
    previousResponseId = response.id;
  }

  throw new Error(`OpenAI response exceeded maximum tool rounds (${MAX_RESPONSE_ROUNDS})`);
}

async function executeLocalFunctionCalls(
  calls: ResponseFunctionToolCall[],
  handlers: BuiltTools["localFunctionHandlers"],
): Promise<ResponseInputItem.FunctionCallOutput[]> {
  const outputs: ResponseInputItem.FunctionCallOutput[] = [];

  for (const call of calls) {
    const handler = handlers[call.name];

    if (!handler) {
      throw new Error(`No local function handler registered for ${call.name}`);
    }

    try {
      outputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: await handler(call.arguments),
      });
    } catch (error) {
      log.error("Local function tool execution failed", {
        callId: call.call_id,
        callName: call.name,
        error,
      });
      throw error;
    }
  }

  return outputs;
}

function isLocalFunctionCall(item: Response["output"][number]): item is ResponseFunctionToolCall {
  return item.type === "function_call";
}
