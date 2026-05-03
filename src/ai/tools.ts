import { buildGoogleCalendarFunctionTools, createGoogleCalendarFunctionHandlers } from "@/calendar";
import { getEnv } from "@/shared/env";
import type { Task, ToolName } from "@/task/task.type";
import type {
  FunctionTool,
  Tool as OpenaiTools,
  WebSearchTool,
} from "openai/resources/responses/responses.js";

type LocalFunctionHandler = (rawArguments: string) => Promise<string>;

export type BuiltTools = {
  localFunctionHandlers: Record<string, LocalFunctionHandler>;
  tools: OpenaiTools[];
};

export function buildTools(props: {
  toolNames: ToolName[];
  webSearchConfig?: Task["web_search"];
}): BuiltTools {
  const { toolNames, webSearchConfig } = props;
  const tools: OpenaiTools[] = [];
  const localFunctionHandlers: Record<string, LocalFunctionHandler> = {};

  if (toolNames.includes("web_search")) {
    tools.push(buildWebSearchTool(webSearchConfig));
  }

  if (toolNames.includes("google_calendar")) {
    tools.push(...buildGoogleCalendarToolSet());
    Object.assign(localFunctionHandlers, createGoogleCalendarFunctionHandlers());
  }

  if (toolNames.includes("memories")) {
    tools.push(buildNoteManagementTool());
  }

  return {
    localFunctionHandlers,
    tools,
  };
}

function buildWebSearchTool(webSearchConfig?: Task["web_search"]): WebSearchTool {
  // web_search docs: https://developers.openai.com/api/docs/guides/tools-web-search
  return {
    type: "web_search",
    search_context_size: webSearchConfig?.search_context_size || "medium",
    user_location: webSearchConfig?.user_location || null,
  } as const;
}

function buildGoogleCalendarToolSet(): FunctionTool[] {
  return buildGoogleCalendarFunctionTools();
}

function buildNoteManagementTool(): OpenaiTools {
  return {
    type: "mcp",
    server_label: "note_management",
    server_description: "Internal note management / memories tool",
    server_url: "https://note-management-mcp.matejpesl.cz/mcp",
    authorization: getEnv().MEMORIES_MCP_API_KEY,
    require_approval: "never",
    defer_loading: false,
  } as const;
}
