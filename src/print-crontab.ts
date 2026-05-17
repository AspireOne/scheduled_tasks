import path from "node:path";
import { parseServerCliArgs } from "./shared/server-cli";
import { buildServerHelpText, CliUsageError, printHelp, printVersion } from "./shared/cli";
import { loadTasksFromDirectory } from "./task";
import { setGlobalLogLevel } from "./shared/logger";

function main() {
  const { tasksDir, defaultsPath, help, version } = parseServerCliArgs(process.argv, "scheduler");
  if (help) {
    printHelp(
      buildServerHelpText({
        command: "print-crontab",
        usage: "tsx src/print-crontab.ts [options]",
        description: "Print crontab entries for all cron-enabled tasks in a directory.",
        includeMode: false,
        examples: [
          "pnpm dlx tsx src/print-crontab.ts --tasks tasks-examples",
          "pnpm dlx tsx src/print-crontab.ts --tasks tasks-examples --defaults ./defaults.toml",
        ],
      }),
    );
    return;
  }
  if (version) {
    printVersion();
    return;
  }
  const runTaskScriptPath = path.resolve(__dirname, "..", "run-task.sh");
  setGlobalLogLevel("WARN");

  const cronLines = loadTasksFromDirectory(tasksDir, defaultsPath ? { defaultsPath } : undefined)
    .filter(({ task }) => task.cron != null)
    .sort((a, b) => a.taskPath.localeCompare(b.taskPath))
    .map(({ task, taskPath, defaultsPath: resolvedDefaultsPath }) => {
      const cron = task.cron as string;
      const absoluteTaskPath = path.resolve(taskPath);
      const command = `${cron} ${shellEscape(runTaskScriptPath)} ${shellEscape(absoluteTaskPath)}`;
      return resolvedDefaultsPath
        ? `${command} ${shellEscape(path.resolve(resolvedDefaultsPath))}`
        : command;
    });

  for (const line of cronLines) {
    process.stdout.write(`${line}\n`);
  }
}

function shellEscape(value: string): string {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

try {
  main();
} catch (err) {
  if (err instanceof CliUsageError) {
    process.stderr.write(`${err.message}\n`);
    process.exit(err.exitCode);
  }
  throw err;
}
