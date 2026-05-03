import type { Task, ToolName } from "@/task/task.type";
import type { Tool as OpenaiTools } from "openai/resources/responses/responses.js";

export function buildTools(props: {
  toolNames: ToolName[];
  webSearchConfig?: Task["web_search"];
  googleCalendarAccessToken?: string;
}): OpenaiTools[] {
  const { toolNames, webSearchConfig, googleCalendarAccessToken } = props;
  const tools: OpenaiTools[] = [];

  if (toolNames.includes("web_search")) {
    tools.push(buildWebSearchTool(webSearchConfig));
  }

  if (toolNames.includes("google_calendar")) {
    if (!googleCalendarAccessToken) {
      throw new Error("google_calendar tool requested without an access token");
    }

    tools.push(buildGoogleCalendarTool(googleCalendarAccessToken));
  }

  return tools;
}

function buildWebSearchTool(webSearchConfig?: Task["web_search"]) {
  // web_search docs: https://developers.openai.com/api/docs/guides/tools-web-search
  return {
    type: "web_search",
    search_context_size: webSearchConfig?.search_context_size || "medium",
    user_location: webSearchConfig?.user_location || null,
  } as const;
}

function buildGoogleCalendarTool(accessToken: string) {
  // Google defined ones, see https://developers.google.com/workspace/calendar/api/v3/reference/mcp#tools
  const tools = [
    "create_event",
    "update_event",
    "delete_event",
    "list_events",
    "get_event",
    // "suggest_time",

    // openai defined ones, see https://developers.openai.com/api/docs/guides/tools-connectors-mcp#available-tools-in-each-connector
    "search_events", // this is the same for google defines ones
    "read_event",
    "fetch",
    "search",
    "get_profile",
  ];

  return {
    type: "mcp",
    defer_loading: false,
    server_label: "google_calendar",
    connector_id: "connector_googlecalendar",
    authorization: accessToken,
    require_approval: "never",
    allowed_tools: tools,
  } as const;
}
