import * as fs from "node:fs";
import * as path from "node:path";

export const taskDefaultsFileName = "defaults.toml";

export function resolveTaskDefaultsPath(params: {
  tasksDir: string;
  defaultsPath?: string;
}): string | undefined {
  if (params.defaultsPath) {
    const defaultsPath = path.resolve(params.defaultsPath);
    if (!fs.existsSync(defaultsPath)) {
      throw new Error(`Defaults file does not exist: ${defaultsPath}`);
    }
    if (!fs.statSync(defaultsPath).isFile()) {
      throw new Error(`Defaults path is not a file: ${defaultsPath}`);
    }
    return defaultsPath;
  }

  const candidate = path.join(path.resolve(params.tasksDir), taskDefaultsFileName);
  return fs.existsSync(candidate) ? candidate : undefined;
}

export function isTaskDefaultsPath(taskPath: string): boolean {
  return path.basename(taskPath) === taskDefaultsFileName;
}
