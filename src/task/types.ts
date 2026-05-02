import type { Effort, KnownModel, NotificationChannel, ToolName } from "@/shared/constants";

export type Task = {
  task_name: string;
  system_prompt?: string;
  prompt: string;
  model: KnownModel | (string & {});
  effort: Effort;
  toolNames: ToolName[];
  notification_channels: NotificationChannel[];
};
