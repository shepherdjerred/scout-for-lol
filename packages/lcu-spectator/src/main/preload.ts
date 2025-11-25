import { contextBridge, ipcRenderer } from "electron";

type SpectatorConfig = {
  discordToken: string;
  discordChannelId: string;
  lockfilePath?: string;
  pollIntervalMs?: number;
};

export interface LogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  data?: unknown;
}

export interface ElectronAPI {
  startSpectator: (config: SpectatorConfig) => Promise<{ success: boolean; error?: string }>;
  stopSpectator: () => Promise<{ success: boolean; error?: string }>;
  getStatus: () => Promise<{ running: boolean }>;
  checkLockfile: () => Promise<{ exists: boolean; error?: string }>;
  selectFolder: () => Promise<string | null>;
  restartAndUpdate: () => Promise<void>;
  getLogs: (limit?: number) => Promise<{ success: boolean; logs: LogEntry[]; error?: string }>;
  clearLogs: () => Promise<{ success: boolean; error?: string }>;
  exportLogs: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>;
  openLogsFolder: () => Promise<{ success: boolean; error?: string }>;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  onLogEntry: (callback: (entry: LogEntry) => void) => void;
}

const electronAPI: ElectronAPI = {
  startSpectator: (config) => ipcRenderer.invoke("start-spectator", config),
  stopSpectator: () => ipcRenderer.invoke("stop-spectator"),
  getStatus: () => ipcRenderer.invoke("get-status"),
  checkLockfile: () => ipcRenderer.invoke("check-lockfile"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  restartAndUpdate: () => ipcRenderer.invoke("restart-and-update"),
  getLogs: (limit) => ipcRenderer.invoke("get-logs", limit),
  clearLogs: () => ipcRenderer.invoke("clear-logs"),
  exportLogs: () => ipcRenderer.invoke("export-logs"),
  openLogsFolder: () => ipcRenderer.invoke("open-logs-folder"),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update-downloaded", callback);
  },
  onLogEntry: (callback) => {
    ipcRenderer.on("log-entry", (_event, entry) => callback(entry));
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
