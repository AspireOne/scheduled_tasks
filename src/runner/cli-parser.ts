import { parseArgs } from "node:util";

export function parseCliArgs(args: string[]) {
  const { values, positionals } = parseArgs({
    args: args.slice(2), // strip "node" and script path
    options: {
      "task-path": { type: "string", short: "c" },
    },
    allowPositionals: true,
  });

  return { values, positionals };
}

export type CliArgs = ReturnType<typeof parseCliArgs>;
