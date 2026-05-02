import type { Effort, KnownModel, NotificationChannel, Tool } from "@/shared/types";

export type Task = {
  task_name: string;
  system_prompt?: string;
  prompt: string;
  model: KnownModel | (string & {});
  effort: Effort;
  tools: Tool[];
  notification_channels: NotificationChannel[];
};
