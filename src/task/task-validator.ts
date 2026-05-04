import type { Result } from "@/shared/types";
import type { Task } from "./task.type";
import { taskValues } from "./task-values";
import cron from "node-cron";

type RuleProperties = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

const validationRules: Record<keyof Task, RuleProperties> = {
  prompt: {
    minLength: 1,
    maxLength: 30_000,
    required: true,
  },
  system_prompt: {
    maxLength: 30_000,
  },
  cron: {
    minLength: 1,
    maxLength: 255,
  },
  task_name: {
    maxLength: 255,
    minLength: 1,
    required: true,
  },
  tool_names: {
    required: true,
  },
  notification_channels: {
    required: true,
  },
  notifications: {},
  effort: {
    required: true,
  },
  model: {
    required: true,
  },
  web_search: {},
  discord_channel_id: {},
};

export function validateTask(task: Task): Result {
  const warnings: string[] = [];
  const errors: string[] = [];

  validateRequiredFieldsPresence(task, errors);
  if (errors.length !== 0) return { success: false, errors, warnings };

  validateValues(task, errors, warnings);
  validateLengthConstraints(task, errors);
  validateNotificationConfig(task, errors);
  validateDiscordChannelId(task, errors);
  validateCron(task, errors);

  const success = errors.length === 0;
  return { success, errors, warnings };
}

function validateValues(task: Task, errors: string[], warnings: string[]) {
  const notificationChannelsAreValid = task.notification_channels.every((channel) =>
    taskValues.notificationChannels.includes(channel),
  );
  const toolNamesAreValid = task.tool_names.every((toolName) =>
    taskValues.toolNames.includes(toolName),
  );
  const effortIsValid = taskValues.efforts.includes(task.effort);
  const modelIsKnown = (taskValues.models as readonly string[]).includes(task.model);

  if (!notificationChannelsAreValid) errors.push("invalid notification channel(s)");
  if (!toolNamesAreValid) errors.push("invalid tool name(s)");
  if (!effortIsValid) errors.push("invalid effort");
  if (!modelIsKnown) warnings.push(`Model ${task.model} is not known. Make sure it is correct.`);
}

function validateRequiredFieldsPresence(task: Task, errors: string[]): void {
  const requiredFields = Object.entries(validationRules)
    .filter(([, rule]) => rule.required)
    .map(([key]) => [key, task[key as keyof Task]] as const);

  for (const [key, value] of requiredFields) {
    if (value == null) errors.push(`Missing required field: ${key}`);

    if (typeof value === "string" && value?.length === 0) {
      errors.push(`Required field ${key} is empty.`);
    }
  }
}

function validateLengthConstraints(task: Task, errors: string[]): void {
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = task[key as keyof Task];
    if (value == null) continue;

    if (typeof value !== "string") {
      continue;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`Field ${key} exceeds max length (${rule.maxLength}).`);
    }

    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`Field ${key} is smaller than min length (${rule.minLength})`);
    }
  }
}

function validateNotificationConfig(task: Task, errors: string[]): void {
  if (task.notifications == null) return;
  if (!isPlainObject(task.notifications)) {
    errors.push("notifications must be a table/object");
    return;
  }

  if (!("log" in task.notifications) || task.notifications.log == null) return;
  if (!isPlainObject(task.notifications.log)) {
    errors.push("notifications.log must be a table/object");
    return;
  }

  if (!("file_path" in task.notifications.log) || task.notifications.log.file_path == null) return;
  if (typeof task.notifications.log.file_path !== "string") {
    errors.push("notifications.log.file_path must be a string");
    return;
  }

  if (task.notifications.log.file_path.length === 0) {
    errors.push("notifications.log.file_path must not be empty");
  }
}

function validateDiscordChannelId(task: Task, errors: string[]): void {
  if (!task.notification_channels.includes("discord")) return;

  if (!task.discord_channel_id || task.discord_channel_id.length === 0) {
    errors.push('discord_channel_id is required when "discord" is in notification_channels');
  }
}

function validateCron(task: Task, errors: string[]): void {
  if (task.cron == null) return;

  if (typeof task.cron !== "string") {
    errors.push("cron must be a string");
    return;
  }

  const fieldCount = task.cron.trim().split(/\s+/).length;
  if (fieldCount !== 5 || !cron.validate(task.cron)) {
    errors.push("cron must be a valid 5-field cron expression");
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
