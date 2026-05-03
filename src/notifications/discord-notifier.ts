import { logger } from "@/shared/logger";
import { chunkDiscordMessage, DISCORD_MESSAGE_LIMIT } from "./discord-message-chunker";

const log = logger.withContext("discord-notifier");

type NotificationPayload = {
  taskName: string;
  content: string;
};

export async function sendDiscordNotification(
  payload: NotificationPayload,
  webhookUrl: string,
): Promise<void> {
  const messageChunks = buildDiscordMessages(payload);

  for (const messageChunk of messageChunks) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: messageChunk,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      log.error("Discord notification failed", {
        status: response.status,
        statusText: response.statusText,
        responseBody,
      });
      throw new Error(`Discord notification failed with status ${response.status}`);
    }
  }
}

function buildDiscordMessages(payload: NotificationPayload): string[] {
  const header = `Task: ${payload.taskName}`;
  const content = payload.content.trim();

  if (content.length === 0) {
    return [`${header}\n\nTask finished without any text output.`];
  }

  const firstMessageContentLimit = DISCORD_MESSAGE_LIMIT - `${header}\n\n`.length;
  const firstBodyChunk = content.slice(0, firstMessageContentLimit);
  const remainingContent = content.slice(firstMessageContentLimit);
  const remainingChunks = chunkDiscordMessage(remainingContent);

  return [`${header}\n\n${firstBodyChunk}`, ...remainingChunks];
}
