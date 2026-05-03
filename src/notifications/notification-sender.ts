import { logger } from "@/shared/logger";
import type { NotificationChannel } from "@/task";
import { sendDiscordNotification } from "./discord-notifier";

const log = logger.withContext("notification-sender");

type NotificationPayload = {
  taskName: string;
  content: string;
};

export async function sendNotifications(params: {
  channels: NotificationChannel[];
  discordWebhokUrl: string;
  payload: NotificationPayload;
}): Promise<void> {
  for (const channel of params.channels) {
    switch (channel) {
      case "discord":
        await sendDiscordNotification(params.payload, params.discordWebhokUrl);
        break;
      case "log":
        log.info(params.payload.content);
        break;
      default:
        channel satisfies never;
    }
  }
}
