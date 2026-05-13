import { logger } from "@/shared/logger";
import { getEnv } from "@/shared/env";
import { chunkDiscordMessage, DISCORD_MESSAGE_LIMIT } from "./message-chunker";

const log = logger.withContext("discord-post-message");

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS = 1 << 2;

type PostMessageParams = {
  channelId: string;
  taskName: string;
  content: string;
};

export async function postDiscordMessage(params: PostMessageParams): Promise<void> {
  const messages = buildMessages(params);
  const token = getEnv().DISCORD_BOT_TOKEN;

  for (const message of messages) {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${params.channelId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify({
        content: message,
        flags: DISCORD_MESSAGE_FLAG_SUPPRESS_EMBEDS,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      log.error("Discord post failed", {
        channelId: params.channelId,
        status: response.status,
        statusText: response.statusText,
        responseBody,
      });
      throw new Error(`Discord post failed with status ${response.status}`);
    }
  }
}

function buildMessages(params: PostMessageParams): string[] {
  const header = `Task: ${params.taskName}`;
  const content = params.content.trim();

  if (content.length === 0) {
    return [`${header}\n\nTask finished without any text output.`];
  }

  const firstMessageContentLimit = DISCORD_MESSAGE_LIMIT - `${header}\n\n`.length;
  const firstBodyChunk = content.slice(0, firstMessageContentLimit);
  const remainingContent = content.slice(firstMessageContentLimit);
  const remainingChunks = chunkDiscordMessage(remainingContent);

  return [`${header}\n\n${firstBodyChunk}`, ...remainingChunks];
}
