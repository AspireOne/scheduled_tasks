import pc from "picocolors";
import packageJson from "../../package.json";

const version = packageJson.version;
const indent = "  ";

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
  process.stdout.write(`${pc.bold(version)}\n`);
}

export function formatUsageError(message: string): string {
  return `${pc.red("Error:")} ${message}\n${pc.dim("Run with --help for usage.")}`;
}

export function buildRunHelpText(): string {
  return buildHelpText({
    usage: "tsx src/index.ts [options] [task-file]",
    description: "Run one task immediately.",
    options: [
      {
        flags: "-t, --task <file>",
        description: "Task TOML file to run",
      },
      {
        flags: "--defaults <file>",
        description: "Defaults TOML file",
      },
      {
        flags: "--continue",
        description: "Continue a previous conversation",
      },
      {
        flags: "-m, --message <text>",
        description: "Message to send with --continue",
      },
      {
        flags: "-h, --help",
        description: "Show this help message",
      },
      {
        flags: "-V, --version",
        description: "Show the CLI version",
      },
    ],
    argumentsSection: [
      {
        name: "task-file",
        description: "Optional positional task file; use instead of --task",
      },
    ],
    examples: [
      "pnpm dlx tsx src/index.ts --task tasks-examples/weekly-review.toml",
      "pnpm dlx tsx src/index.ts tasks-examples/weekly-review.toml",
      'node dist/index.js --task tasks-examples/weekly-review.toml --continue -m "your reply"',
    ],
  });
}

export function buildServerHelpText(params: {
  command: "server" | "scheduler" | "bot" | "print-crontab";
  usage: string;
  description: string;
  includeMode: boolean;
  examples: string[];
}): string {
  const { usage, description, includeMode, examples } = params;

  return buildHelpText({
    usage,
    description,
    options: [
      {
        flags: "--tasks <dir>",
        description: "Tasks directory",
        defaultValue: ".tasks",
      },
      {
        flags: "--defaults <file>",
        description: "Defaults TOML file",
      },
      ...(includeMode
        ? [
            {
              flags: "--mode <mode>",
              description: 'One of: "bot", "scheduler", "all"',
            },
          ]
        : []),
      {
        flags: "-h, --help",
        description: "Show this help message",
      },
      {
        flags: "-V, --version",
        description: "Show the CLI version",
      },
    ],
    examples,
  });
}

function buildHelpText(params: {
  usage: string;
  description: string;
  options: HelpEntry[];
  argumentsSection?: HelpEntry[];
  examples: string[];
}): string {
  const { usage, description, options, argumentsSection, examples } = params;

  const lines = [
    `${pc.bold(pc.cyan("Usage"))} ${pc.bold(usage)}`,
    "",
    pc.white(description),
    "",
    renderSection("Options", options),
  ];

  if (argumentsSection && argumentsSection.length > 0) {
    lines.push("", renderSection("Arguments", argumentsSection));
  }

  lines.push("", `${pc.bold(pc.cyan("Examples"))}`);
  lines.push(...examples.map((example) => `${indent}${pc.green(example)}`));

  return lines.join("\n");
}

function renderSection(title: string, entries: HelpEntry[]): string {
  const width = Math.max(...entries.map((entry) => entry.flags?.length ?? entry.name?.length ?? 0));

  return [pc.bold(pc.cyan(title)), ...entries.map((entry) => renderEntry(entry, width))].join("\n");
}

function renderEntry(entry: HelpEntry, width: number): string {
  const label = entry.flags ?? entry.name ?? "";
  const paddedLabel = label.padEnd(width);
  const descriptionParts = [entry.description];
  if (entry.defaultValue) {
    descriptionParts.push(pc.dim(`(default: ${entry.defaultValue})`));
  }

  return `${indent}${pc.yellow(paddedLabel)}  ${descriptionParts.join(" ")}`;
}

type HelpEntry = {
  flags?: string;
  name?: string;
  description: string;
  defaultValue?: string;
};
