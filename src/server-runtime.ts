import { parseArgs } from "node:util";
import { globalConfig } from "./config";
import { startCronScheduler } from "./scheduler/index.js";
import { validateDiscordEnvOrThrow, validateOpenAIEnvOrThrow } from "./shared/env";
import { logger, pruneLogFile } from "./shared/logger";

export type ServerMode = "bot" | "scheduler" | "all";

export function parseServerCliArgs(
  args: string[],
  defaultMode: ServerMode,
): {
  tasksDir: string;
  defaultsPath: string | undefined;
  mode: ServerMode;
} {
  const { values } = parseArgs({
    args: args.slice(2),
    options: {
      "tasks-dir": { type: "string", default: globalConfig.defaultTasksDir },
      defaults: { type: "string" },
      mode: { type: "string", default: defaultMode },
    },
    allowPositionals: false,
  });

  const mode = values.mode;
  if (mode !== "bot" && mode !== "scheduler" && mode !== "all") {
    throw new Error(`Invalid mode "${mode}". Expected one of: bot, scheduler, all.`);
  }

  return {
    tasksDir: values["tasks-dir"],
    defaultsPath: values.defaults,
    mode,
  };
}

export async function startServerRuntime(params: {
  tasksDir: string;
  defaultsPath?: string;
  mode: ServerMode;
  logContext: string;
  startMessage: string;
}): Promise<void> {
  const { tasksDir, defaultsPath, mode, logContext, startMessage } = params;
  const log = logger.withContext(logContext);

  pruneLogFile(globalConfig.maxLogLines);
  log.info(startMessage);
  log.info("Using tasks dir", { tasksDir, defaultsPath, mode });

  validateOpenAIEnvOrThrow();

  if (mode === "bot" || mode === "all") {
    validateDiscordEnvOrThrow();
  }

  if (mode === "scheduler" || mode === "all") {
    startCronScheduler(tasksDir, defaultsPath ? { defaultsPath } : undefined);
  }

  if (mode === "bot" || mode === "all") {
    const { buildChannelTaskMap, startDiscordListener } = await import("./discord/index.js");
    const channelTaskMap = buildChannelTaskMap(
      tasksDir,
      defaultsPath ? { defaultsPath } : undefined,
    );
    if (channelTaskMap.size === 0) {
      log.warn(
        "No tasks have a discord_channel_id configured. Bot will run but ignore all messages.",
      );
    }

    await startDiscordListener({ channelTaskMap });
    log.info("Discord listener started; awaiting messages.");
    return;
  }

  log.info("Cron scheduler started; awaiting scheduled runs.");
}
