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

    try {
      await invoke("connect_lcu");
      await loadStatus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnectLcu = async () => {
    setError(null);
    setLoading("Disconnecting from League Client...");

    try {
      await invoke("disconnect_lcu");
      await loadStatus();
    } catch (err) {
      setError(getErrorMessage(err));
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

    try {
      await invoke("configure_discord", { botToken, channelId });
      await loadStatus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleStartMonitoring = async () => {
    setError(null);
    setLoading("Starting monitoring...");

    try {
      await invoke("start_monitoring");
      setIsMonitoring(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleStopMonitoring = async () => {
    setError(null);
    setLoading("Stopping monitoring...");

    try {
      await invoke("stop_monitoring");
      setIsMonitoring(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Scout for LoL</h1>
        <p className="subtitle">Live Game Updates for Discord</p>
      </header>

      <main className="main">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && <div className="alert alert-info">{loading}</div>}

        {/* League Client Connection */}
        <section className="section">
          <h2>League Client</h2>
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Status:</span>
              <span
                className={`status-badge ${lcuStatus.connected ? "status-connected" : "status-disconnected"}`}
              >
                {lcuStatus.connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {lcuStatus.summonerName && (
              <div className="status-row">
                <span className="status-label">Summoner:</span>
                <span>{lcuStatus.summonerName}</span>
              </div>
            )}

            <div className="button-group">
              {!lcuStatus.connected ? (
                <button
                  onClick={() => {
                    void handleConnectLcu();
                  }}
                  className="button button-primary"
                  disabled={loading !== null}
                >
                  Connect to League Client
                </button>
              ) : (
                <button
                  onClick={() => {
                    void handleDisconnectLcu();
                  }}
                  className="button button-secondary"
                  disabled={loading !== null}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Discord Configuration */}
        <section className="section">
          <h2>Discord Configuration</h2>
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Status:</span>
              <span
                className={`status-badge ${discordStatus.connected ? "status-connected" : "status-disconnected"}`}
              >
                {discordStatus.connected ? "Configured" : "Not Configured"}
              </span>
            </div>

            {!discordStatus.connected && (
              <div className="form">
                <div className="form-group">
                  <label htmlFor="bot-token">Bot Token</label>
                  <input
                    id="bot-token"
                    type="password"
                    value={botToken}
                    onChange={(e) => {
                      setBotToken(e.target.value);
                    }}
                    placeholder="Your Discord bot token"
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="channel-id">Channel ID</label>
                  <input
                    id="channel-id"
                    type="text"
                    value={channelId}
                    onChange={(e) => {
                      setChannelId(e.target.value);
                    }}
                    placeholder="Discord channel ID"
                    className="input"
                  />
                </div>

                <button
                  onClick={() => {
                    void handleConfigureDiscord();
                  }}
                  className="button button-primary"
                  disabled={loading !== null}
                >
                  Configure Discord
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Monitoring Control */}
        {lcuStatus.connected && discordStatus.connected && (
          <section className="section">
            <h2>Monitoring</h2>
            <div className="status-card">
              <div className="status-row">
                <span className="status-label">Status:</span>
                <span
                  className={`status-badge ${isMonitoring ? "status-monitoring" : "status-idle"}`}
                >
                  {isMonitoring ? "Monitoring Active" : "Idle"}
                </span>
              </div>

              <div className="button-group">
                {!isMonitoring ? (
                  <button
                    onClick={() => {
                      void handleStartMonitoring();
                    }}
                    className="button button-success"
                    disabled={loading !== null}
                  >
                    Start Monitoring
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void handleStopMonitoring();
                    }}
                    className="button button-danger"
                    disabled={loading !== null}
                  >
                    Stop Monitoring
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
