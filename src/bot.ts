import { parseArgs } from "node:util";
import { globalConfig } from "./config";
import { buildChannelTaskMap, startDiscordListener } from "./discord";
import { validateDiscordEnvOrThrow, validateOpenAIEnvOrThrow } from "./shared/env";
import { logger, pruneLogFile } from "./shared/logger";

process.loadEnvFile();
const log = logger.withContext("bot");

const DEFAULT_TASKS_DIR = ".tasks";

async function main() {
  pruneLogFile(globalConfig.maxLogLines);
  log.info("==================== Bot started ====================");

  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "tasks-dir": { type: "string", default: DEFAULT_TASKS_DIR },
    },
    allowPositionals: false,
  });
  const tasksDir = values["tasks-dir"];
  log.info("Using tasks dir", { tasksDir });

  validateOpenAIEnvOrThrow();
  validateDiscordEnvOrThrow();

  const channelTaskMap = buildChannelTaskMap(tasksDir);
  if (channelTaskMap.size === 0) {
    log.warn(
      "No tasks have a discord_channel_id configured. Bot will run but ignore all messages.",
    );
  }

  await startDiscordListener({ channelTaskMap });
  log.info("Discord listener started; awaiting messages.");
}

void main().catch((err: unknown) => {
  log.error("Bot failed to start", err);
  process.exit(1);
});
