import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
}

interface LcuStatus {
  connected: boolean;
  summonerName: string | null;
  inGame: boolean;
}

interface DiscordStatus {
  connected: boolean;
  channelName: string | null;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "error" | "warning";
  message: string;
}

export default function App() {
  const [lcuStatus, setLcuStatus] = useState<LcuStatus>({
    connected: false,
    summonerName: null,
    inGame: false,
  });

  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>({
    connected: false,
    channelName: null,
  });

  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry["level"], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), { timestamp, level, message }]);
  };

  // Load status on mount
  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus();
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadStatus = async () => {
    try {
      const lcu = await invoke<LcuStatus>("get_lcu_status");
      setLcuStatus(lcu);

      const discord = await invoke<DiscordStatus>("get_discord_status");
      setDiscordStatus(discord);
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  };

  const handleConnectLcu = async () => {
    setError(null);
    setLoading("Connecting to League Client...");
    addLog("info", "Attempting to connect to League Client...");

    try {
      await invoke("connect_lcu");
      await loadStatus();
      addLog("info", "Successfully connected to League Client");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to connect to League Client: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnectLcu = async () => {
    setError(null);
    setLoading("Disconnecting from League Client...");
    addLog("info", "Disconnecting from League Client...");

    try {
      await invoke("disconnect_lcu");
      await loadStatus();
      addLog("info", "Disconnected from League Client");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to disconnect: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleConfigureDiscord = async () => {
    if (!botToken || !channelId) {
      setError("Please provide both bot token and channel ID");
      return;
    }

    setError(null);
    setLoading("Configuring Discord...");
    addLog("info", `Configuring Discord for channel ${channelId}...`);

    try {
      await invoke("configure_discord", { botToken, channelId });
      await loadStatus();
      addLog("info", "Discord configured successfully");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to configure Discord: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleStartMonitoring = async () => {
    setError(null);
    setLoading("Starting monitoring...");
    addLog("info", "Starting game monitoring...");

    try {
      await invoke("start_monitoring");
      setIsMonitoring(true);
      addLog("info", "Game monitoring started successfully");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to start monitoring: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleStopMonitoring = async () => {
    setError(null);
    setLoading("Stopping monitoring...");
    addLog("info", "Stopping game monitoring...");

    try {
      await invoke("stop_monitoring");
      setIsMonitoring(false);
      addLog("info", "Game monitoring stopped");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to stop monitoring: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-6 text-center dark:border-gray-800 dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Scout for LoL
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Live Game Updates for Discord
        </p>
        <button
          onClick={() => {
            setShowDebug(!showDebug);
          }}
          className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {showDebug ? "Hide" : "Show"} Debug Panel
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-8 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {loading}
              </p>
            </div>
          )}

          {/* League Client Connection */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              League Client
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    lcuStatus.connected
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {lcuStatus.connected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {lcuStatus.summonerName && (
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Summoner:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {lcuStatus.summonerName}
                  </span>
                </div>
              )}

              <div className="mt-6">
                {!lcuStatus.connected ? (
                  <button
                    onClick={() => {
                      void handleConnectLcu();
                    }}
                    disabled={loading !== null}
                    className="w-full rounded-lg bg-discord-blurple px-4 py-3 font-medium text-white transition-colors hover:bg-discord-blurple/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Connect to League Client
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void handleDisconnectLcu();
                    }}
                    disabled={loading !== null}
                    className="w-full rounded-lg bg-gray-500 px-4 py-3 font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Discord Configuration */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Discord Configuration
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    discordStatus.connected
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {discordStatus.connected ? "Configured" : "Not Configured"}
                </span>
              </div>

              {!discordStatus.connected && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="bot-token"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Bot Token
                    </label>
                    <input
                      id="bot-token"
                      type="password"
                      value={botToken}
                      onChange={(e) => {
                        setBotToken(e.target.value);
                      }}
                      placeholder="Your Discord bot token"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="channel-id"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Channel ID
                    </label>
                    <input
                      id="channel-id"
                      type="text"
                      value={channelId}
                      onChange={(e) => {
                        setChannelId(e.target.value);
                      }}
                      placeholder="Discord channel ID"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      void handleConfigureDiscord();
                    }}
                    disabled={loading !== null}
                    className="w-full rounded-lg bg-discord-blurple px-4 py-3 font-medium text-white transition-colors hover:bg-discord-blurple/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Configure Discord
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Monitoring Control */}
          {lcuStatus.connected && discordStatus.connected && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Monitoring
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isMonitoring
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {isMonitoring ? "Monitoring Active" : "Idle"}
                  </span>
                </div>

                <div className="mt-6">
                  {!isMonitoring ? (
                    <button
                      onClick={() => {
                        void handleStartMonitoring();
                      }}
                      disabled={loading !== null}
                      className="w-full rounded-lg bg-discord-green px-4 py-3 font-medium text-white transition-colors hover:bg-discord-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Monitoring
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        void handleStopMonitoring();
                      }}
                      disabled={loading !== null}
                      className="w-full rounded-lg bg-discord-red px-4 py-3 font-medium text-white transition-colors hover:bg-discord-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Stop Monitoring
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <aside className="lg:w-96">
            <div className="sticky top-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Debug Panel
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      LCU Connected:
                    </span>
                    <span
                      className={`font-medium ${lcuStatus.connected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {lcuStatus.connected ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discord Configured:
                    </span>
                    <span
                      className={`font-medium ${discordStatus.connected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {discordStatus.connected ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Monitoring:
                    </span>
                    <span
                      className={`font-medium ${isMonitoring ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      {isMonitoring ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Logs
                    </h4>
                    <button
                      onClick={() => {
                        setLogs([]);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-96 space-y-1 overflow-y-auto rounded-md bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No logs yet
                      </p>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className={`${
                            log.level === "error"
                              ? "text-red-600 dark:text-red-400"
                              : log.level === "warning"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span className="text-gray-500 dark:text-gray-500">
                            [{log.timestamp}]
                          </span>{" "}
                          {log.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
