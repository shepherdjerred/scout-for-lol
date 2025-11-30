import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Sidebar } from "./components/layout/sidebar.tsx";
import { LeagueSection } from "./components/sections/league-section.tsx";
import { DiscordSection } from "./components/sections/discord-section.tsx";
import { MonitorSection } from "./components/sections/monitor-section.tsx";
import { DebugPanel } from "./components/sections/debug-panel.tsx";
import { Alert } from "./components/ui/alert.tsx";
import type { LcuStatus, DiscordStatus, Config, LogEntry, LogPaths, Section } from "./types.ts";
import { DEFAULT_EVENT_SOUNDS, getErrorMessage } from "./types.ts";

export default function App() {
  // Navigation state
  const [activeSection, setActiveSection] = useState<Section>("league");

  // Connection states
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
    activeSoundPack: null,
  });

  // Form states
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [voiceChannelId, setVoiceChannelId] = useState("");
  const [soundPack, setSoundPack] = useState("base");
  const [eventSounds, setEventSounds] = useState<Record<string, string>>(DEFAULT_EVENT_SOUNDS);

  // App states
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logPaths, setLogPaths] = useState<LogPaths | null>(null);

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
  // eslint-disable-next-line custom-rules/no-use-effect -- ok for now
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<Config>("load_config");
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
        if (config.eventSounds) {
          setEventSounds((prev) => ({
            ...prev,
            ...config.eventSounds,
          }));
        }
        if (config.botToken || config.channelId || config.voiceChannelId) {
          addLog("info", "Loaded saved Discord configuration");
        }

        // Fetch log paths for easier debugging
        try {
          const paths = await invoke<LogPaths>("get_log_paths");
          setLogPaths(paths);
          addLog("info", `Log files: ${paths.working_dir_log} (working dir), ${paths.app_log_dir} (app logs)`);
        } catch (pathErr) {
          console.error("Failed to load log paths:", pathErr);
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };

    void loadConfig();
  }, []);

  // Load status on mount and setup polling
  // eslint-disable-next-line custom-rules/no-use-effect -- ok for now
  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus();
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [loadStatus]);

  // Listen for backend logs
  // eslint-disable-next-line custom-rules/no-use-effect -- ok for now
  useEffect(() => {
    const unlisten = listen<string>("backend-log", (event) => {
      addLog("info", event.payload);
    });

    return () => {
      void (async () => {
        const fn = await unlisten;
        fn();
      })();
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
        eventSounds,
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

  const handleJoinVoice = async () => {
    setError(null);
    setLoading("Joining voice channel...");
    addLog("info", "Requesting voice connection...");

    try {
      await invoke("join_discord_voice", { voiceChannelId: voiceChannelId || null });
      await loadStatus();
      addLog("info", "Voice join request sent");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to join voice: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleTestSound = async () => {
    setError(null);
    setLoading("Playing test sound...");
    addLog("info", "Playing test sound...");

    try {
      await invoke("play_test_sound");
      addLog("info", "Test sound requested");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      addLog("error", `Failed to play test sound: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const handleEventSoundChange = (key: string, value: string) => {
    setEventSounds((prev) => ({
      ...prev,
      [key]: value,
    }));
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

  // Render active section content
  const renderSection = () => {
    switch (activeSection) {
      case "league":
        return (
          <LeagueSection
            lcuStatus={lcuStatus}
            loading={loading}
            onConnect={() => void handleConnectLcu()}
            onDisconnect={() => void handleDisconnectLcu()}
          />
        );
      case "discord":
        return (
          <DiscordSection
            discordStatus={discordStatus}
            loading={loading}
            botToken={botToken}
            channelId={channelId}
            voiceChannelId={voiceChannelId}
            soundPack={soundPack}
            eventSounds={eventSounds}
            onBotTokenChange={setBotToken}
            onChannelIdChange={setChannelId}
            onVoiceChannelIdChange={setVoiceChannelId}
            onSoundPackChange={setSoundPack}
            onEventSoundChange={handleEventSoundChange}
            onConfigure={() => void handleConfigureDiscord()}
            onJoinVoice={() => void handleJoinVoice()}
            onTestSound={() => void handleTestSound()}
          />
        );
      case "monitor":
        return (
          <MonitorSection
            isMonitoring={isMonitoring}
            loading={loading}
            lcuConnected={lcuStatus.connected}
            discordConnected={discordStatus.connected}
            inGame={lcuStatus.inGame}
            onStart={() => void handleStartMonitoring()}
            onStop={() => void handleStopMonitoring()}
            onTest={() => void handleTestEvents()}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        lcuConnected={lcuStatus.connected}
        discordConnected={discordStatus.connected}
        voiceConnected={discordStatus.voiceConnected}
        isMonitoring={isMonitoring}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        showDebug={showDebug}
        onToggleDebug={() => {
          setShowDebug(!showDebug);
        }}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Error/Loading Alerts */}
        {(error !== null || loading !== null) && (
          <div className="border-b border-gray-800 px-8 py-5 space-y-4">
            {error && (
              <Alert
                variant="error"
                onDismiss={() => {
                  setError(null);
                }}
              >
                {error}
              </Alert>
            )}
            {loading && <Alert variant="loading">{loading}</Alert>}
          </div>
        )}

        {/* Section Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">{renderSection()}</div>
      </main>

      {/* Debug Panel */}
      {showDebug && (
        <DebugPanel
          lcuStatus={lcuStatus}
          discordStatus={discordStatus}
          isMonitoring={isMonitoring}
          logs={logs}
          logPaths={logPaths}
          onClearLogs={handleClearLogs}
          onClose={() => {
            setShowDebug(false);
          }}
        />
      )}
    </div>
  );
}
