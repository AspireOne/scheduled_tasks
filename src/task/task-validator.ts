import { taskConfigValues } from "../shared/constants";
import type { Result } from "../shared/types";
import { type Task } from "./types";

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
  task_name: {
    maxLength: 255,
    minLength: 1,
    required: true,
  },
  toolNames: {
    required: true,
  },
  notification_channels: {
    required: true,
  },
  effort: {
    required: true,
  },
  model: {
    required: true,
  },
};

export function validateTask(task: Task): Result {
  const warnings: string[] = [];
  const errors: string[] = [];

  validateRequiredFieldsPresence(task, errors);
  if (errors.length !== 0) return { success: false, errors, warnings };

  validateValues(task, errors, warnings);
  validateLengthConstraints(task, errors);

  const success = errors.length === 0;
  return { success, errors, warnings };
}

function validateValues(task: Task, errors: string[], warnings: string[]) {
  const notificationChannelsAreValid = task.notification_channels.every((channel) =>
    taskConfigValues.notificationChannels.includes(channel),
  );
  const toolNamesAreValid = task.toolNames.every((toolName) =>
    taskConfigValues.toolNames.includes(toolName),
  );
  const effortIsValid = taskConfigValues.efforts.includes(task.effort);
  const modelIsKnown = (taskConfigValues.models as readonly string[]).includes(task.model);

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
      // TODO: Log a logic error when logger exists.
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
