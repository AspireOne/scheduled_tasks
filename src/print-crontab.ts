import path from "node:path";
import { parseServerCliArgs } from "./server-runtime";
import { loadTasksFromDirectory } from "./task";
import { setGlobalLogLevel } from "./shared/logger";

function main() {
  const { tasksDir, defaultsPath } = parseServerCliArgs(process.argv, "scheduler");
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

main();
