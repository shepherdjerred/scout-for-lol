/* eslint-disable no-restricted-imports -- Electron main process requires Node.js APIs */
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { join } from "node:path";
import { logger } from "./logger.js";

// Dynamic imports for ES modules
let SpectatorService: typeof import("@scout-for-lol/backend/league/lcu/spectator.js").SpectatorService;
type SpectatorConfig = import("@scout-for-lol/backend/league/lcu/spectator.js").SpectatorConfig;

let mainWindow: BrowserWindow | null = null;
let spectatorService: SpectatorService | null = null;
let isQuitting = false;

// Initialize logger
logger.info("LCU Spectator starting", {
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
});

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on("update-available", () => {
  if (mainWindow) {
    mainWindow.webContents.send("update-available");
  }
});
autoUpdater.on("update-downloaded", () => {
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded");
  }
});

function createWindow(): void {
  const isDev = process.env.NODE_ENV === "development";
  let iconPath: string;
  if (process.platform === "win32") {
    iconPath = join(__dirname, "../assets/icon.ico");
  } else if (process.platform === "darwin") {
    iconPath = join(__dirname, "../assets/icon.icns");
  } else {
    iconPath = join(__dirname, "../assets/icon.png");
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false, // Security: Disable Node.js in renderer
      contextIsolation: true, // Security: Isolate context between main and renderer
      sandbox: false, // Note: sandbox requires different preload setup
      webSecurity: true, // Security: Enable web security
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Load ES modules
async function loadModules(): Promise<void> {
  if (!SpectatorService) {
    const module = await import("@scout-for-lol/backend/league/lcu/spectator.js");
    SpectatorService = module.SpectatorService;
  }
}

// IPC handlers
ipcMain.handle("start-spectator", async (_event, config: SpectatorConfig) => {
  try {
    logger.info("Starting spectator service", { channelId: config.discordChannelId });
    await loadModules();

    if (spectatorService) {
      logger.debug("Stopping existing spectator service");
      spectatorService.stop();
    }

    spectatorService = new SpectatorService(config);
    await spectatorService.start();

    logger.info("Spectator service started successfully");
    return { success: true };
  } catch (error) {
    logger.error("Failed to start spectator service", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("stop-spectator", async () => {
  try {
    logger.info("Stopping spectator service");
    if (spectatorService) {
      spectatorService.stop();
      spectatorService = null;
    }
    logger.info("Spectator service stopped");
    return { success: true };
  } catch (error) {
    logger.error("Failed to stop spectator service", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("get-status", async () => {
  return {
    running: spectatorService !== null,
  };
});

ipcMain.handle("check-lockfile", async () => {
  try {
    logger.debug("Checking for League client lockfile");
    const { getLCUConnection } = await import("@scout-for-lol/backend/league/lcu/lockfile.js");
    await getLCUConnection();
    logger.debug("League client lockfile found");
    return { exists: true };
  } catch (error) {
    logger.debug("League client lockfile not found", { error });
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("get-logs", async (_event, limit: number) => {
  try {
    const logs = await logger.getLogs(limit);
    return { success: true, logs };
  } catch (error) {
    logger.error("Failed to get logs", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: [],
    };
  }
});

ipcMain.handle("clear-logs", async () => {
  try {
    await logger.clearLogs();
    return { success: true };
  } catch (error) {
    logger.error("Failed to clear logs", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("open-logs-folder", async () => {
  try {
    const logPath = logger.getLogFilePath();
    const logDir = join(logPath, "..");
    await shell.openPath(logDir);
    return { success: true };
  } catch (error) {
    logger.error("Failed to open logs folder", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("export-logs", async () => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      title: "Export Logs",
      defaultPath: `lcu-spectator-logs-${new Date().toISOString().split("T")[0]}.txt`,
      filters: [{ name: "Text Files", extensions: ["txt"] }],
    });

    if (!filePath) {
      return { success: false, cancelled: true };
    }

    const logs = await logger.getLogs(10000);
    const content = logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join("\n");
    const fs = await import("node:fs/promises");
    await fs.writeFile(filePath, content, "utf-8");

    logger.info("Logs exported", { filePath });
    return { success: true, filePath };
  } catch (error) {
    logger.error("Failed to export logs", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("restart-and-update", async () => {
  isQuitting = true;
  autoUpdater.quitAndInstall();
});

// Set up log streaming to renderer
logger.addListener((entry) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("log-entry", entry);
  }
});

// App lifecycle
void app.whenReady().then(() => {
  logger.info("App ready, creating window");
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      logger.debug("No windows open, creating new window");
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  if (spectatorService) {
    spectatorService.stop();
  }
});

// Handle auto-updater events
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
});

autoUpdater.on("update-not-available", () => {
  console.log("Update not available");
});

autoUpdater.on("error", (err) => {
  console.error("Error in auto-updater:", err);
});
