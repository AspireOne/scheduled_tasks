import type { NotificationChannel } from "@/task";
import { sendDiscordNotification } from "./discord-notifier";
import { sendLogNotification } from "./log-notifier";

type NotificationPayload = {
  taskName: string;
  content: string;
};

export async function sendNotifications(params: {
  channels: NotificationChannel[];
  discordWebhokUrl: string;
  logFilePath: string;
  payload: NotificationPayload;
}): Promise<void> {
  for (const channel of params.channels) {
    switch (channel) {
      case "discord":
        await sendDiscordNotification(params.payload, params.discordWebhokUrl);
        break;
      case "log":
        sendLogNotification({
          filePath: params.logFilePath,
          payload: params.payload,
        });
        break;
      default:
        channel satisfies never;
    }
  }
}
