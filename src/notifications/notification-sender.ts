import type { NotificationChannel } from "@/task";
import { postDiscordMessage } from "@/discord";
import { sendLogNotification } from "./log-notifier";

type NotificationPayload = {
  taskName: string;
  content: string;
  discordContent?: string;
};

export async function sendNotifications(params: {
  channels: NotificationChannel[];
  discordChannelId: string | undefined;
  logFilePath: string;
  payload: NotificationPayload;
}): Promise<void> {
  for (const channel of params.channels) {
    switch (channel) {
      case "discord":
        await postDiscordMessage({
          channelId: params.discordChannelId!,
          taskName: params.payload.taskName,
          content: params.payload.discordContent ?? params.payload.content,
        });
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
