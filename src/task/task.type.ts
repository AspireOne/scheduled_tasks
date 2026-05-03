import type { taskValues } from "./task-values";

export type Task = {
  task_name: string;
  system_prompt?: string;
  prompt: string;
  model: Model | (string & {});
  effort: Effort;
  tool_names: ToolName[];
  notification_channels: NotificationChannel[];
  // TODO: Make sure smol-toml will parse it in this nested way (in TOML it would be [web_search.user_location])
  web_search?: {
    search_context_size?: SearchContextSize;
    user_location?: {
      type?: WebSearchUserLocationType;
      country?: string;
      city?: string;
      region?: string;
    };
  };
};

export type Effort = (typeof taskValues.efforts)[number];
export type Model = (typeof taskValues.models)[number];
export type ToolName = (typeof taskValues.toolNames)[number];
export type NotificationChannel = (typeof taskValues.notificationChannels)[number];
export type SearchContextSize = (typeof taskValues.webSearch.searchContextSize)[number];
export type WebSearchUserLocationType = (typeof taskValues.webSearch.user_location.type)[number];
