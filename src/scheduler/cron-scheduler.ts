import cron from "node-cron";
import { logger } from "@/shared/logger";
import { loadTasksFromDirectory } from "@/task";
import { run } from "@/runner";

const log = logger.withContext("cron-scheduler");

export function startCronScheduler(tasksDir: string): void {
  const scheduledTasks = loadTasksFromDirectory(tasksDir)
    .filter(({ task }) => task.cron != null)
    .map(({ task, taskPath }) => ({
      taskName: task.task_name,
      taskPath,
      cron: task.cron as string,
    }));

  if (scheduledTasks.length === 0) {
    log.info("No cron-enabled tasks found.");
    return;
  }

  log.info(`Starting cron scheduler with ${scheduledTasks.length} task(s).`);
  for (const task of scheduledTasks) {
    log.info("Registered cron task", {
      taskName: task.taskName,
      cron: task.cron,
      taskPath: task.taskPath,
    });
  }

  const inFlightTasks = new Set<string>();
  for (const task of scheduledTasks) {
    cron.schedule(task.cron, () => {
      if (inFlightTasks.has(task.taskPath)) {
        log.warn("Skipping cron run because the previous invocation is still in progress.", {
          taskName: task.taskName,
          taskPath: task.taskPath,
        });
        return;
      }

      inFlightTasks.add(task.taskPath);

      void run({ taskPath: task.taskPath })
        .then(() => {
          log.info("Cron task finished.", { taskName: task.taskName, taskPath: task.taskPath });
        })
        .catch((err: unknown) => {
          log.error("Cron task failed.", {
            taskName: task.taskName,
            taskPath: task.taskPath,
            err,
          });
        })
        .finally(() => {
          inFlightTasks.delete(task.taskPath);
        });
    });
  }
}
