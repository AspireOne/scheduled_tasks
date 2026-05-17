import { parseArgs } from "node:util";

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args: args.slice(2), // strip "node" and script path
    options: {
      task: { type: "string", short: "t" },
      defaults: { type: "string" },
      continue: { type: "boolean", default: false },
      message: { type: "string", short: "m" },
    },
    allowPositionals: true,
  });

  return {
    taskPath: values.task,
    defaultsPath: values.defaults,
    continue: values.continue ?? false,
    message: values.message,
    positionals,
  };
}

export function validateCliArgsOrThrow(args: CliArgsParsed): asserts args is CliArgsValidated {
  if (!args.taskPath || args.taskPath.length === 0) {
    throw new Error("You must pass task path.");
  }

  if (args.continue && (!args.message || args.message.length === 0)) {
    throw new Error("--continue requires --message <text>.");
  }
}

type CliArgsParsed = ReturnType<typeof parseCliArgs>;

type CliArgsBase = {
  taskPath: string;
  defaultsPath: string | undefined;
  positionals: string[];
};

export type CliArgsValidated =
  | (CliArgsBase & { continue: false; message: string | undefined })
  | (CliArgsBase & { continue: true; message: string });
