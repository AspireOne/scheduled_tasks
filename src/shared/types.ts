import type { constants } from "./constants";

export type Result =
  | { success: false; errors: string[]; warnings: string[] }
  | { success: true; warnings: string[] };

export type Effort = (typeof constants.efforts)[number];
export type KnownModel = (typeof constants.knownModels)[number];
export type Tool = (typeof constants.tools)[number];
export type NotificationChannel = (typeof constants.notificationChannels)[number];
