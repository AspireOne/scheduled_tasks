import type { ToolName } from "@/shared/constants";
import type { Tool as OpenaiTools } from "openai/resources/responses/responses.js";

export const tools = [{ type: "web_search" }] as const;

export function getTools(toolNames: ToolName[]): OpenaiTools[] {
  const tools: OpenaiTools[] = [];

  return tools;
}
