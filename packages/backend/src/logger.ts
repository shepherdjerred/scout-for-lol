/**
 * Structured logging utility using tslog
 *
 * Features:
 * - INFO and above to STDOUT
 * - ALL logs (including DEBUG/TRACE) to file
 * - Automatic file name detection in log output
 * - Named loggers for each module
 *
 * Usage:
 * ```typescript
 * import { createLogger } from "./logger";
 * const logger = createLogger("module-name");
 * logger.info("Application started");
 * logger.debug("Debug details", { data });
 * logger.error("Error occurred", error);
 * ```
 */
import { Logger, type ILogObj, type ISettingsParam } from "tslog";
// Bun.write() does not support append mode (see https://github.com/oven-sh/bun/issues/10473)
// Bun implements node:fs for this use case, and recommends using it for file appending
// eslint-disable-next-line no-restricted-imports -- Bun.write() lacks append support, node:fs/promises is the official Bun-recommended approach for file appending
import { appendFile, mkdir } from "node:fs/promises";

/**
 * Log levels in tslog:
 * 0 = silly
 * 1 = trace
 * 2 = debug
 * 3 = info
 * 4 = warn
 * 5 = error
 * 6 = fatal
 */

const LOG_FILE_PATH = Bun.env.LOG_FILE_PATH ?? "./logs/app.log";
const LOG_LEVEL_STDOUT = Bun.env.LOG_LEVEL_STDOUT ?? "info";
const LOG_LEVEL_FILE = Bun.env.LOG_LEVEL_FILE ?? "debug";

// Map log level names to numbers
const LOG_LEVEL_MAP: Record<string, number> = {
  silly: 0,
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
};

function getLogLevelNumber(level: string): number {
  return LOG_LEVEL_MAP[level.toLowerCase()] ?? 3; // Default to info
}

// Ensure log directory exists
async function ensureLogDirectory(): Promise<void> {
  const lastSlash = LOG_FILE_PATH.lastIndexOf("/");
  const logDir = lastSlash > 0 ? LOG_FILE_PATH.slice(0, lastSlash) : ".";
  if (logDir !== ".") {
    try {
      await mkdir(logDir, { recursive: true });
    } catch {
      // Directory might already exist, that's fine
    }
  }
}

// Initialize log directory (fire and forget)
void ensureLogDirectory();

type LogMeta = {
  logLevelName?: string;
  logLevelId?: number;
  name?: string;
  path?: {
    filePathWithLine?: string;
  };
};

/**
 * File transport that writes all log levels to a file
 * Uses async appendFile in fire-and-forget mode
 */
function fileTransport(logObj: ILogObj): void {
  const timestamp = new Date().toISOString();
  const meta = logObj._meta as LogMeta | undefined;
  const level = String(meta?.logLevelName ?? "INFO").toUpperCase();
  const name = String(meta?.name ?? "app");
  const filePath = meta?.path?.filePathWithLine ?? "";

  // Extract message and additional data
  const args = Object.entries(logObj)
    .filter(([key]) => !key.startsWith("_"))
    .map(([, value]) => value);

  const message = args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ""}`;
      }
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");

  const logLine = `${timestamp} [${level}] [${name}] ${filePath ? `(${filePath}) ` : ""}${message}\n`;

  // Fire and forget async append
  void appendFile(LOG_FILE_PATH, logLine).catch(() => {
    // Silently fail if we can't write to the log file
    // We don't want logging failures to crash the app
  });
}

/**
 * Base logger settings for all loggers
 */
const baseSettings: ISettingsParam<ILogObj> = {
  type: "pretty",
  minLevel: getLogLevelNumber(LOG_LEVEL_STDOUT),
  prettyLogTemplate:
    "{{dateIsoStr}} {{logLevelName}} [{{name}}] {{filePathWithLine}}\t",
  prettyLogTimeZone: "UTC",
  stylePrettyLogs: true,
  prettyLogStyles: {
    logLevelName: {
      "*": ["bold", "black", "bgWhiteBright"],
      SILLY: ["bold", "white", "bgMagenta"],
      TRACE: ["bold", "white", "bgCyan"],
      DEBUG: ["bold", "white", "bgBlue"],
      INFO: ["bold", "white", "bgGreen"],
      WARN: ["bold", "white", "bgYellow"],
      ERROR: ["bold", "white", "bgRed"],
      FATAL: ["bold", "white", "bgRedBright"],
    },
    dateIsoStr: "gray",
    filePathWithLine: "dim",
    name: "cyan",
  },
  hideLogPositionForProduction: false,
  // Attach file transport for all logs
  attachedTransports: [
    (logObj: ILogObj) => {
      // File transport logs everything (level 0 = silly)
      const meta = logObj._meta as LogMeta | undefined;
      const logLevel = meta?.logLevelId ?? 3;
      const minFileLevel = getLogLevelNumber(LOG_LEVEL_FILE);
      if (logLevel >= minFileLevel) {
        fileTransport(logObj);
      }
    },
  ],
};

/**
 * Root logger instance
 */
const rootLogger = new Logger<ILogObj>(baseSettings);

/**
 * Create a named logger for a specific module
 *
 * @param name - The name of the module (e.g., "discord", "api", "database")
 * @returns A logger instance with the given name
 *
 * @example
 * ```typescript
 * const logger = createLogger("discord");
 * logger.info("Bot connected");
 * logger.debug("Processing message", { messageId });
 * logger.error("Failed to send message", error);
 * ```
 */
export function createLogger(name: string): Logger<ILogObj> {
  return rootLogger.getSubLogger({ name });
}

/**
 * Default logger for quick use
 * Prefer createLogger() with a module name for better log organization
 */
export const logger = rootLogger;

/**
 * Log levels for reference
 */
export const LogLevel = {
  SILLY: 0,
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5,
  FATAL: 6,
} as const;
