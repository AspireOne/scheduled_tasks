import { Client, Events, GatewayIntentBits, type Message } from "discord.js";
import { run } from "@/runner";
import { getEnv } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { ChannelTaskMap } from "./channel-task-map";
import { postDiscordMessage } from "./post-message";

const log = logger.withContext("discord-listener");

const TYPING_REFRESH_MS = 8_000;

export async function startDiscordListener(params: {
  channelTaskMap: ChannelTaskMap;
}): Promise<void> {
  const { channelTaskMap } = params;
  const inFlight = new Set<string>();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    log.info(`Discord listener ready as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, (message) => {
    void handleMessage({ message, channelTaskMap, inFlight });
  });

  await client.login(getEnv().DISCORD_BOT_TOKEN);
}

async function handleMessage(params: {
  message: Message;
  channelTaskMap: ChannelTaskMap;
  inFlight: Set<string>;
}): Promise<void> {
  const { message, channelTaskMap, inFlight } = params;

  if (message.author.bot) return;

  const mapping = channelTaskMap.get(message.channelId);
  if (!mapping) return;

  if (inFlight.has(mapping.taskName)) {
    log.warn(`Task busy, rejecting reply`, { taskName: mapping.taskName });
    await safePost(
      message.channelId,
      mapping.taskName,
      "Task is currently running. Please retry once it completes.",
    );
    return;
  }

  if (!message.content || message.content.trim().length === 0) {
    log.debug("Ignoring empty message", { channelId: message.channelId });
    return;
  }

  inFlight.add(mapping.taskName);
  const typingInterval = startTypingLoop(message);

  try {
    log.info("Continuing task from Discord reply", {
      taskName: mapping.taskName,
      author: message.author.username,
    });
    await run({
      taskPath: mapping.taskPath,
      ...(mapping.defaultsPath ? { defaultsPath: mapping.defaultsPath } : {}),
      continue: { message: message.content },
    });
  } catch (err) {
    log.error("Failed to handle Discord reply", err);
    await safePost(
      message.channelId,
      mapping.taskName,
      `Reply failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearInterval(typingInterval);
    inFlight.delete(mapping.taskName);
  }
}

function startTypingLoop(message: Message): NodeJS.Timeout {
  const channel = message.channel;
  const trySendTyping = () => {
    if ("sendTyping" in channel && typeof channel.sendTyping === "function") {
      void channel.sendTyping().catch(() => {});
    }
  };
  trySendTyping();
  return setInterval(trySendTyping, TYPING_REFRESH_MS);
}

async function safePost(channelId: string, taskName: string, content: string): Promise<void> {
  try {
    await postDiscordMessage({ channelId, taskName, content });
  } catch (err) {
    log.error("Failed to post error/notice message to Discord", err);
  }
}
