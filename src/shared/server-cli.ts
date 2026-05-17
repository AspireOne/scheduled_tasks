import { parseArgs } from "node:util";
import { globalConfig } from "../config";
import { CliUsageError, formatUsageError } from "./cli";

export type ServerMode = "bot" | "scheduler" | "all";

export function parseServerCliArgs(
  args: string[],
  defaultMode: ServerMode,
): {
  tasksDir: string;
  defaultsPath: string | undefined;
  mode: ServerMode;
  help: boolean;
  version: boolean;
} {
  try {
    const { values, positionals } = parseArgs({
      args: args.slice(2),
      options: {
        tasks: { type: "string", default: globalConfig.defaultTasksDir },
        defaults: { type: "string" },
        mode: { type: "string", default: defaultMode },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "V", default: false },
      },
      allowPositionals: true,
    });

    if (positionals.length > 0) {
      throw new CliUsageError(
        formatUsageError(
          `This command does not accept positional arguments: ${positionals.join(", ")}`,
        ),
      );
    }

    const mode = values.mode;
    if (mode !== "bot" && mode !== "scheduler" && mode !== "all") {
      throw new CliUsageError(
        formatUsageError(`Invalid mode "${mode}". Expected one of: bot, scheduler, all.`),
      );
    }

    return {
      tasksDir: values.tasks,
      defaultsPath: values.defaults,
      mode,
      help: values.help ?? false,
      version: values.version ?? false,
    };
  } catch (err) {
    if (err instanceof CliUsageError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new CliUsageError(formatUsageError(message));
  }
}
