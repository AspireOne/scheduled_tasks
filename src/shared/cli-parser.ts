import { parseArgs } from "node:util";

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args: args.slice(2), // strip "node" and script path
    options: {
      "task-path": { type: "string", short: "c" },
    },
    allowPositionals: true,
  });

  return {
    taskPath: values["task-path"],
    positionals,
  };
}

export function validateCliArgsOrThrow(args: CliArgsParsed): asserts args is CliArgsValidated {
  if (!args.taskPath || args.taskPath.length === 0) {
    throw new Error("You must pass task path.");
  }
}

export type CliArgsParsed = ReturnType<typeof parseCliArgs>;
export type CliArgsValidated = Omit<CliArgsParsed, "taskPath"> & { taskPath: string };
