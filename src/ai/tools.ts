import type { Task, ToolName } from "@/task/task.type";
import type { Tool as OpenaiTools } from "openai/resources/responses/responses.js";

function buildWebSearchTool(webSearchConfig?: Task["web_search"]) {
  // web_search docs: https://developers.openai.com/api/docs/guides/tools-web-search
  return {
    type: "web_search",
    search_context_size: webSearchConfig?.search_context_size || "medium",
    user_location: webSearchConfig?.user_location || null,
  } as const;
}

export function getTools(props: {
  toolNames: ToolName[];
  webSearchConfig?: Task["web_search"];
}): OpenaiTools[] {
  const { toolNames, webSearchConfig } = props;
  const tools: OpenaiTools[] = [];

  if (toolNames.includes("web_search")) {
    tools.push(buildWebSearchTool(webSearchConfig));
  }

  return tools;
}
