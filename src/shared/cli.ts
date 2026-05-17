import packageJson from "../../package.json";

const version = packageJson.version;

export class CliUsageError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
    this.name = "CliUsageError";
  }
}

export function printHelp(text: string): void {
  process.stdout.write(`${text}\n`);
}

export function printVersion(): void {
  process.stdout.write(`${version}\n`);
}

export function formatUsageError(message: string): string {
  return `${message}\nRun with --help for usage.`;
}

export function buildRunHelpText(): string {
  return [
    "Usage: tsx src/index.ts [options] [task-file]",
    "",
    "Run one task immediately.",
    "",
    "Options:",
    "  -t, --task <file>      Task TOML file to run",
    "      --defaults <file>  Defaults TOML file",
    "      --continue         Continue a previous conversation",
    "  -m, --message <text>   Message to send with --continue",
    "  -h, --help             Show this help message",
    "  -V, --version          Show the CLI version",
    "",
    "Arguments:",
    "  task-file              Optional positional task file; use instead of --task",
    "",
    "Examples:",
    "  pnpm dlx tsx src/index.ts --task tasks-examples/weekly-review.toml",
    "  pnpm dlx tsx src/index.ts tasks-examples/weekly-review.toml",
    '  node dist/index.js --task tasks-examples/weekly-review.toml --continue -m "your reply"',
  ].join("\n");
}

export function buildServerHelpText(params: {
  command: "server" | "scheduler" | "bot" | "print-crontab";
  usage: string;
  description: string;
  includeMode: boolean;
  examples: string[];
}): string {
  const { usage, description, includeMode, examples } = params;

  return [
    `Usage: ${usage}`,
    "",
    description,
    "",
    "Options:",
    "      --tasks <dir>      Tasks directory (default .tasks)",
    "      --defaults <file>  Defaults TOML file",
    ...(includeMode ? ['      --mode <mode>      One of: "bot", "scheduler", "all"'] : []),
    "  -h, --help             Show this help message",
    "  -V, --version          Show the CLI version",
    "",
    "Examples:",
    ...examples.map((example) => `  ${example}`),
  ].join("\n");
}
