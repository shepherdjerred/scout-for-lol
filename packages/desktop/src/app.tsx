import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  LeagueClientSection,
  DiscordConfigSection,
  MonitoringSection,
  DebugPanel,
} from "./components";

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}

type LcuStatus = {
  connected: boolean;
  summonerName: string | null;
  inGame: boolean;
};

type DiscordStatus = {
  connected: boolean;
  channelName: string | null;
  voiceConnected: boolean;
  voiceChannelName: string | null;
};

type Config = {
  botToken: string | null;
  channelId: string | null;
  voiceChannelId: string | null;
  soundPack: string | null;
};

type SoundPackSummary = {
  name: string;
  description: string;
  events: string[];
};

type LogEntry = {
  timestamp: string;
  level: "info" | "error" | "warning";
  message: string;
};

export default function App() {
  const [lcuStatus, setLcuStatus] = useState<LcuStatus>({
    connected: false,
    summonerName: null,
    inGame: false,
  });

  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>({
    connected: false,
    channelName: null,
    voiceConnected: false,
    voiceChannelName: null,
  });

  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [voiceChannelId, setVoiceChannelId] = useState("");
  const [soundPack, setSoundPack] = useState("base");
  const [soundPacks, setSoundPacks] = useState<SoundPackSummary[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry["level"], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), { timestamp, level, message }]);
  };

  const loadStatus = useCallback(async () => {
    try {
      const lcu = await invoke<LcuStatus>("get_lcu_status");
      setLcuStatus(lcu);

      const discord = await invoke<DiscordStatus>("get_discord_status");
      setDiscordStatus(discord);
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<Config>("load_config");
        if (config.botToken || config.channelId) {
          if (config.botToken) {
            setBotToken(config.botToken);
          }
          if (config.channelId) {
            setChannelId(config.channelId);
          }
          if (config.voiceChannelId) {
            setVoiceChannelId(config.voiceChannelId);
          }
          if (config.soundPack) {
            setSoundPack(config.soundPack);
          }
          addLog("info", "Loaded saved Discord configuration");
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };

    void loadConfig();
  }, []);

  // Load status on mount and setup polling
  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus();
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [loadStatus]);

  // Load available sound packs on startup
  useEffect(() => {
    const fetchSoundPacks = async () => {
      try {
        const packs = await invoke<SoundPackSummary[]>("list_sound_packs");
        setSoundPacks(packs);
        if (packs.length > 0 && !soundPack) {
          setSoundPack(packs[0].name);
        }
      } catch (err) {
        console.error("Failed to load sound packs:", err);
      }
    };

    void fetchSoundPacks();
  }, []);

  // Listen for backend logs
  useEffect(() => {
    const unlisten = listen<string>("backend-log", (event) => {
      addLog("info", event.payload);
    });

    return () => {
      void unlisten.then((fn) => {
        fn();
      });
    };
  }, []);

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
      await invoke("configure_discord", {
        botToken,
        channelId,
        voiceChannelId: voiceChannelId || null,
        soundPack,
      });
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

      // Check diagnostics after starting
      try {
        const diagnostics = await invoke<{
          gameflow_phase: string;
          live_client_data_available: boolean;
          live_client_data_status: number | null;
          error_message: string | null;
        }>("get_diagnostics");

          addLog("info", `Gameflow phase: ${diagnostics.gameflow_phase}`);
          if (diagnostics.live_client_data_available) {
            addLog("info", `Live Client Data API: Available (status: ${String(diagnostics.live_client_data_status)})`);
          } else {
            addLog("error", `Live Client Data API: NOT AVAILABLE`);
            addLog("error", `To enable: League Client → Settings → Game → Enable Live Client Data API`);
            addLog("error", `Then restart League Client and reconnect.`);
            if (diagnostics.error_message) {
              addLog("error", `Error: ${diagnostics.error_message}`);
            }
          }
      } catch (diagErr) {
        addLog("warning", `Could not get diagnostics: ${getErrorMessage(diagErr)}`);
      }
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

  const handleTestEvents = async () => {
    setError(null);
    setLoading("Testing event detection...");
    addLog("info", "Testing event detection...");

    try {
      const result = await invoke<{
        success: boolean;
        event_count: number;
        events_found: string[];
        error_message: string | null;
        raw_data_keys: string[] | null;
      }>("test_event_detection");

      if (result.success) {
        addLog("info", `Found ${String(result.event_count)} events`);
        if (result.events_found.length > 0) {
          addLog("info", `Event types: ${result.events_found.join(", ")}`);
          const killEvents = result.events_found.filter((e) => e.includes("Kill"));
          if (killEvents.length > 0) {
            addLog("info", `Kill events found: ${killEvents.join(", ")}`);
          } else {
            addLog("warning", "No kill events found in current events");
          }
        }
        if (result.raw_data_keys) {
          addLog("info", `Available data keys: ${result.raw_data_keys.join(", ")}`);
        }
      } else {
        addLog("error", `Event detection failed: ${result.error_message ?? "Unknown error"}`);
        if (result.raw_data_keys) {
          addLog("info", `Available data keys: ${result.raw_data_keys.join(", ")}`);
        }
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to test events: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-6 text-center dark:border-gray-800 dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
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

          <LeagueClientSection
            lcuStatus={lcuStatus}
            loading={loading}
            onConnect={() => {
              void handleConnectLcu();
            }}
            onDisconnect={() => {
              void handleDisconnectLcu();
            }}
          />

          <DiscordConfigSection
            discordStatus={discordStatus}
            loading={loading}
            botToken={botToken}
            channelId={channelId}
            onBotTokenChange={setBotToken}
            onChannelIdChange={setChannelId}
            voiceChannelId={voiceChannelId}
            onVoiceChannelIdChange={setVoiceChannelId}
            soundPack={soundPack}
            soundPacks={soundPacks}
            onSoundPackChange={setSoundPack}
            onConfigure={() => {
              void handleConfigureDiscord();
            }}
          />

          {lcuStatus.connected && discordStatus.connected && (
            <MonitoringSection
              isMonitoring={isMonitoring}
              loading={loading}
              onStart={() => {
                void handleStartMonitoring();
              }}
              onStop={() => {
                void handleStopMonitoring();
              }}
              onTest={() => {
                void handleTestEvents();
              }}
            />
          )}
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <DebugPanel
            lcuStatus={lcuStatus}
            discordStatus={discordStatus}
            isMonitoring={isMonitoring}
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        )}
      </main>
    </div>
  );
}
