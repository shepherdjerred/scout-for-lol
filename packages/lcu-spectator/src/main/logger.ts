/* eslint-disable no-restricted-imports -- Electron main process requires Node.js APIs */
import { writeFile, appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { app } from "electron";
import { existsSync } from "node:fs";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logFile: string;
  private maxLogSize = 5 * 1024 * 1024; // 5MB
  private maxLogFiles = 5;
  private listeners: Array<(entry: LogEntry) => void> = [];

  constructor() {
    const userDataPath = app.getPath("userData");
    const logsDir = join(userDataPath, "logs");
    this.logFile = join(logsDir, "lcu-spectator.log");

    // Ensure logs directory exists
    if (!existsSync(logsDir)) {
      void mkdir(logsDir, { recursive: true }).catch((err) => {
        console.error("Failed to create logs directory:", err);
      });
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  }

  private async writeToFile(message: string): Promise<void> {
    try {
      // Check file size and rotate if needed
      if (existsSync(this.logFile)) {
        const fs = await import("node:fs/promises");
        const stats = await fs.stat(this.logFile);
        if (stats.size > this.maxLogSize) {
          await this.rotateLogs();
        }
      }

      await appendFile(this.logFile, message, "utf-8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private async rotateLogs(): Promise<void> {
    try {
      const fs = await import("node:fs/promises");
      // Rotate existing logs
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        if (existsSync(oldFile)) {
          await fs.rename(oldFile, newFile);
        }
      }

      // Move current log to .1
      if (existsSync(this.logFile)) {
        await fs.rename(this.logFile, `${this.logFile}.1`);
      }
    } catch (error) {
      console.error("Failed to rotate logs:", error);
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const formatted = this.formatMessage(level, message, data);
    console.log(formatted.trim());
    void this.writeToFile(formatted);

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error("Error in log listener:", error);
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  async getLogs(limit = 1000): Promise<LogEntry[]> {
    try {
      if (!existsSync(this.logFile)) {
        return [];
      }

      const fs = await import("node:fs/promises");
      const content = await fs.readFile(this.logFile, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      const entries: LogEntry[] = [];
      for (const line of lines.slice(-limit)) {
        const match = line.match(/^\[(.+?)\] \[(.+?)\] (.+)$/);
        if (match) {
          const [, timestamp, level, message] = match;
          entries.push({
            timestamp,
            level: level as LogLevel,
            message,
          });
        }
      }

      return entries;
    } catch (error) {
      this.error("Failed to read logs", { error });
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      if (existsSync(this.logFile)) {
        await writeFile(this.logFile, "", "utf-8");
      }
      this.info("Logs cleared");
    } catch (error) {
      this.error("Failed to clear logs", { error });
    }
  }

  getLogFilePath(): string {
    return this.logFile;
  }
}

export const logger = new Logger();
