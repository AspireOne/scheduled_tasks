import path from "node:path";
import { parseServerCliArgs } from "./server-runtime";
import { loadTasksFromDirectory } from "./task";
import { setGlobalLogLevel } from "./shared/logger";

function main() {
  const { tasksDir } = parseServerCliArgs(process.argv, "scheduler");
  const runTaskScriptPath = path.resolve(__dirname, "..", "run-task.sh");
  setGlobalLogLevel("WARN");

  const cronLines = loadTasksFromDirectory(tasksDir)
    .filter(({ task }) => task.cron != null)
    .sort((a, b) => a.taskPath.localeCompare(b.taskPath))
    .map(({ task, taskPath }) => {
      const cron = task.cron as string;
      const absoluteTaskPath = path.resolve(taskPath);
      return `${cron} ${shellEscape(runTaskScriptPath)} ${shellEscape(absoluteTaskPath)}`;
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
