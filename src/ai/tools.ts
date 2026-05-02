import type { ToolName } from "@/task/task";
import type { Tool as OpenaiTools } from "openai/resources/responses/responses.js";

// web_search docs: https://developers.openai.com/api/docs/guides/tools-web-search
export const tools = [{ type: "web_search", search_context_size: "high" }] as const;

export function getTools(toolNames: ToolName[]): OpenaiTools[] {
  const tools: OpenaiTools[] = [];

  return tools;
}
