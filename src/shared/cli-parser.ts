import { parseArgs } from "node:util";
import { CliUsageError, formatUsageError } from "./cli";

export function parseCliArgs(args: string[]) {
  try {
    const { values, positionals } = parseArgs({
      args: args.slice(2), // strip "node" and script path
      options: {
        task: { type: "string", short: "t" },
        defaults: { type: "string" },
        continue: { type: "boolean", default: false },
        message: { type: "string", short: "m" },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "V", default: false },
      },
      allowPositionals: true,
    });

    return {
      taskPath: values.task,
      defaultsPath: values.defaults,
      continue: values.continue ?? false,
      message: values.message,
      help: values.help ?? false,
      version: values.version ?? false,
      positionals,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CliUsageError(formatUsageError(message));
  }
}

export function validateCliArgsOrThrow(args: CliArgsParsed): asserts args is CliArgsValidated {
  if (args.positionals.length > 1) {
    throw new CliUsageError(
      formatUsageError(
        `Unexpected extra positional arguments: ${args.positionals.slice(1).join(", ")}`,
      ),
    );
  }

  if (args.taskPath && args.positionals.length === 1) {
    throw new CliUsageError(
      formatUsageError(
        "Pass the task file either as --task <file> or as a positional argument, not both.",
      ),
    );
  }

  const taskPath = args.taskPath ?? args.positionals[0];
  if (!taskPath || taskPath.length === 0) {
    throw new CliUsageError(formatUsageError("Missing required argument: --task <file>."));
  }

  if (args.continue && (!args.message || args.message.length === 0)) {
    throw new CliUsageError(formatUsageError("--continue requires --message <text>."));
  }

  args.taskPath = taskPath;
}

type CliArgsParsed = ReturnType<typeof parseCliArgs>;

type CliArgsBase = {
  taskPath: string;
  defaultsPath: string | undefined;
  help: boolean;
  version: boolean;
  positionals: string[];
};

export type CliArgsValidated =
  | (CliArgsBase & { continue: false; message: string | undefined })
  | (CliArgsBase & { continue: true; message: string });
