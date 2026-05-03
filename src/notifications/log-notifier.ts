import * as fs from "node:fs";
import * as path from "node:path";

type LogNotificationPayload = {
  taskName: string;
  content: string;
};

export function sendLogNotification(params: {
  filePath: string;
  payload: LogNotificationPayload;
}): void {
  const resolvedPath = path.resolve(params.filePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const timestamp = new Date().toISOString();
  const content = params.payload.content.length > 0 ? params.payload.content : "(empty output)";
  const entry = [`[${timestamp}] Task: ${params.payload.taskName}`, content, ""].join("\n");

  fs.appendFileSync(resolvedPath, entry, "utf8");
}

export function getDefaultNotificationLogFilePath(params: {
  taskDirectory: string;
  taskName: string;
}): string {
  return path.resolve(
    params.taskDirectory,
    "logs",
    `${slugifyTaskName(params.taskName)}.notifications.log`,
  );
}

function slugifyTaskName(taskName: string): string {
  const slug = taskName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "task";
}
