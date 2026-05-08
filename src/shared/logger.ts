/* eslint-disable no-console */
import { globalConfig } from "@/config";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * File Logger
 *
 * Writes structured log lines to a file (append-only) and mirrors them to
 * stdout/stderr. Drop-in replacement for the browser Logger with the same
 * context API, adapted for a Node.js environment (no %c CSS styling).
 *
 * ## Basic Usage
 * ```typescript
 * import { logger } from '@/shared/logger';
 *
 * logger.log('App started');           // [22:30:15.3][LOG] App started
 * logger.error('Failed to load', err); // [22:30:15.3][ERROR] Failed to load <error>
 * ```
 *
 * ## Context Usage (Recommended for Modules/Services)
 * ```typescript
 * const log = logger.withContext('Runner');
 *
 * log.info('Task started');   // [22:30:15.3][INFO][Runner] Task started
 * log.error('Failed', err);   // [22:30:15.3][ERROR][Runner] Failed <error>
 * ```
 *
 * ## Nested Contexts
 * ```typescript
 * const log = logger.withContext('Runner').withContext('Validator');
 * log.info('Config valid');  // [22:30:15.3][INFO][Runner][Validator] Config valid
 * ```
 */

/**
 * Set the log file path. Must be called before any log statements.
 * The directory must already exist; the file itself is created if absent.
 *
 * @param filePath - Absolute or relative path to the log file.
 */
function _setLogFilePath(filePath: string): void {
  globalConfig.logFilePath = path.resolve(filePath);
}

export function pruneLogFile(maxLines: number): void {
  try {
    const content = fs.readFileSync(globalConfig.logFilePath, "utf8");
    const lines = content.split(/\r?\n/);

    if (lines.at(-1) === "") {
      lines.pop();
    }

    if (lines.length <= maxLines) {
      return;
    }

    const prunedContent = `${lines.slice(-maxLines).join("\n")}\n`;
    fs.writeFileSync(globalConfig.logFilePath, prunedContent, "utf8");
  } catch {
    // Best-effort: if the file cannot be read or written, do not crash.
  }
}

export type LogLevel = "TRACE" | "DEBUG" | "LOG" | "INFO" | "WARN" | "ERROR";

const logLevelPriority: Record<LogLevel, number> = {
  TRACE: 10,
  DEBUG: 20,
  LOG: 30,
  INFO: 40,
  WARN: 50,
  ERROR: 60,
};

let globalLogLevel: LogLevel = "TRACE";

export function setGlobalLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

function shouldEmit(level: LogLevel): boolean {
  return logLevelPriority[level] >= logLevelPriority[globalLogLevel];
}

/**
 * Get current timestamp in hh:mm:ss.t format (t = tenths of a second, 0-9).
 */
function getTimestamp(): string {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  const t = Math.floor(now.getMilliseconds() / 100);
  return `${hh}:${mm}:${ss}.${t}`;
}

/**
 * Serialize a value to a human-readable string for file output.
 * Errors get their stack trace; objects/arrays get JSON; primitives are coerced.
 */
function serialize(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Unserializable object]";
    }
  }
  return String(value);
}

/**
 * Write a single line to the log file (append-only, synchronous).
 * Failures are silently swallowed to avoid crashing the caller.
 */
function writeToFile(line: string): void {
  try {
    fs.appendFileSync(globalConfig.logFilePath, line + "\n", "utf8");
  } catch {
    // Best-effort: if the file cannot be written, do not crash.
  }
}

class Logger {
  private contexts: string[] = [];

  /**
   * Return a new Logger with an additional context segment appended.
   *
   * @example
   * const log = logger.withContext('Scheduler');
   * log.info('Running');  // [22:30:15.3][INFO][Scheduler] Running
   */
  withContext(context: string): Logger {
    const child = new Logger();
    child.contexts = [...this.contexts, context];
    return child;
  }

  /** Build the plain-text prefix shared by all methods. */
  private buildPrefix(level: LogLevel): string {
    const contextSegments = this.contexts.map((c) => `[${c}]`).join("");
    return `[${getTimestamp()}][${level}]${contextSegments}`;
  }

  /**
   * Format and emit a log line to both the console (stdout/stderr) and the
   * log file.
   *
   * @param level  - Log level label included in the shared prefix.
   * @param consoleFn - The console method to call for mirroring.
   * @param args   - Arbitrary values the caller wants to log.
   */
  private emit(level: LogLevel, consoleFn: (...args: unknown[]) => void, args: unknown[]): void {
    if (!shouldEmit(level)) {
      return;
    }

    const prefix = this.buildPrefix(level);

    // Mirror to console with the prefix prepended to the first argument.
    consoleFn(prefix, ...args);

    // Serialise all arguments into a single line for the file.
    const serialized = args.map(serialize).join(" ");
    writeToFile(`${prefix} ${serialized}`);
  }

  // ── Public logging methods ────────────────────────────────────────────────

  log(...args: unknown[]): void {
    this.emit("LOG", console.log, args);
  }

  debug(...args: unknown[]): void {
    this.emit("DEBUG", console.debug, args);
  }

  info(...args: unknown[]): void {
    this.emit("INFO", console.info, args);
  }

  warn(...args: unknown[]): void {
    this.emit("WARN", console.warn, args);
  }

  error(...args: unknown[]): void {
    this.emit("ERROR", console.error, args);
  }

  trace(...args: unknown[]): void {
    this.emit("TRACE", console.trace, args);
  }

  // ── Table ─────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- console.table accepts `any`
  table(data: any, columns?: string[]): void {
    if (!shouldEmit("LOG")) {
      return;
    }

    const prefix = this.buildPrefix("LOG");
    console.log(prefix, "Table:");
    console.table(data, columns);

    // Represent the table as JSON in the log file.
    const serialized = serialize(data);
    writeToFile(`${prefix} Table:\n${serialized}`);
  }

  // ── Timers ────────────────────────────────────────────────────────────────

  private timers: Map<string, number> = new Map();

  time(label: string = "default"): void {
    if (!shouldEmit("LOG")) {
      return;
    }

    this.timers.set(label, Date.now());
    const prefix = this.buildPrefix("LOG");
    const msg = `Timer started: ${label}`;
    console.log(prefix, msg);
    writeToFile(`${prefix} ${msg}`);
  }

  timeEnd(label: string = "default"): void {
    if (!shouldEmit("LOG")) {
      return;
    }

    const start = this.timers.get(label);
    const prefix = this.buildPrefix("LOG");
    if (start === undefined) {
      const msg = `Timer "${label}" does not exist`;
      const warnPrefix = this.buildPrefix("WARN");
      console.warn(warnPrefix, msg);
      writeToFile(`${warnPrefix} ${msg}`);
      return;
    }
    const elapsed = Date.now() - start;
    this.timers.delete(label);
    const msg = `${label}: ${elapsed}ms`;
    console.log(prefix, msg);
    writeToFile(`${prefix} ${msg}`);
  }

  // ── Groups (console-only; groups have no meaningful file representation) ──

  group(...args: unknown[]): void {
    if (!shouldEmit("LOG")) {
      return;
    }

    const prefix = this.buildPrefix("LOG");
    console.group(prefix, ...args);
    writeToFile(`${prefix} group: ${args.map(serialize).join(" ")}`);
  }

  groupCollapsed(...args: unknown[]): void {
    if (!shouldEmit("LOG")) {
      return;
    }

    const prefix = this.buildPrefix("LOG");
    console.groupCollapsed(prefix, ...args);
    writeToFile(`${prefix} groupCollapsed: ${args.map(serialize).join(" ")}`);
  }

  groupEnd(): void {
    console.groupEnd();
  }
}

/**
 * Global logger instance.
 * Use directly for simple logging, or scope with `.withContext()`.
 *
 * @example
 * logger.log('Hello world');
 *
 * const log = logger.withContext('Runner');
 * log.info('Started');
 */
export const logger = new Logger();
