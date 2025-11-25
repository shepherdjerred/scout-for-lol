import React, { useState, useEffect } from "react";
import { DebugPanel } from "./DebugPanel";
import "./styles.css";

interface Status {
  running: boolean;
}

export function App(): JSX.Element {
  const [discordToken, setDiscordToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [pollInterval, setPollInterval] = useState(2000);
  const [status, setStatus] = useState<Status>({ running: false });
  const [lockfileStatus, setLockfileStatus] = useState<{ exists: boolean; checking: boolean }>({
    exists: false,
    checking: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  useEffect(() => {
    // Check lockfile on mount
    checkLockfile();

    // Check status periodically
    const statusInterval = setInterval(() => {
      void checkStatus();
    }, 2000);

    // Set up update listeners
    window.electron.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    window.electron.onUpdateDownloaded(() => {
      setUpdateDownloaded(true);
    });

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const checkLockfile = async (): Promise<void> => {
    setLockfileStatus({ exists: false, checking: true });
    try {
      const result = await window.electron.checkLockfile();
      setLockfileStatus({ exists: result.exists, checking: false });
      if (!result.exists) {
        setError("League of Legends client not detected. Please make sure the client is running and you're logged in.");
      } else {
        setError(null);
      }
    } catch (err) {
      setLockfileStatus({ exists: false, checking: false });
      setError(`Failed to check lockfile: ${err}`);
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      const currentStatus = await window.electron.getStatus();
      setStatus(currentStatus);
    } catch (err) {
      console.error("Failed to check status:", err);
    }
  };

  const handleStart = async (): Promise<void> => {
    setError(null);
    setSuccess(null);

    if (!discordToken.trim()) {
      setError("Please enter your Discord bot token");
      return;
    }

    if (!channelId.trim()) {
      setError("Please enter your Discord channel ID");
      return;
    }

    try {
      const result = await window.electron.startSpectator({
        discordToken: discordToken.trim(),
        discordChannelId: channelId.trim(),
        pollIntervalMs: pollInterval,
      });

      if (result.success) {
        setSuccess("Spectator service started successfully!");
        setError(null);
        void checkStatus();
      } else {
        setError(result.error ?? "Failed to start spectator service");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleStop = async (): Promise<void> => {
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electron.stopSpectator();
      if (result.success) {
        setSuccess("Spectator service stopped");
        void checkStatus();
      } else {
        setError(result.error ?? "Failed to stop spectator service");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    await window.electron.restartAndUpdate();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 LCU Spectator</h1>
        <p>Real-time League of Legends game event announcements to Discord</p>
      </header>

      {updateDownloaded && (
        <div className="update-banner">
          <div className="update-content">
            <span>✅ Update downloaded! Restart to apply.</span>
            <button onClick={handleUpdate} className="update-button">
              Restart & Update
            </button>
          </div>
        </div>
      )}

      {updateAvailable && !updateDownloaded && (
        <div className="update-banner info">
          <span>🔄 Update available! Downloading...</span>
        </div>
      )}

      <div className="content">
        <section className="section">
          <h2>Status</h2>
          <div className={`status ${status.running ? "running" : "stopped"}`}>
            <span className={`status-icon ${status.running ? "running" : "stopped"}`}></span>
            <strong>{status.running ? "Running" : "Stopped"}</strong>
            {status.running ? " - Monitoring for game events" : " - Configure and start below"}
          </div>

          <div className={`lockfile-status ${lockfileStatus.checking ? "checking" : lockfileStatus.exists ? "exists" : "missing"}`}>
            <span className="lockfile-icon">
              {lockfileStatus.checking ? "⏳" : lockfileStatus.exists ? "✅" : "❌"}
            </span>
            <span>
              {lockfileStatus.checking
                ? "Checking League client..."
                : lockfileStatus.exists
                  ? "League client detected"
                  : "League client not detected"}
            </span>
            <button onClick={checkLockfile} className="refresh-button" disabled={lockfileStatus.checking}>
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="alert error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert success">
            <strong>Success:</strong> {success}
          </div>
        )}

        <section className="section">
          <h2>Configuration</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleStart();
            }}
          >
            <div className="form-group">
              <label htmlFor="discord-token">Discord Bot Token</label>
              <input
                type="password"
                id="discord-token"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
                placeholder="Your Discord bot token"
                disabled={status.running}
                required
              />
              <div className="help-text">
                Get this from{" "}
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                  Discord Developer Portal
                </a>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="channel-id">Discord Channel ID</label>
              <input
                type="text"
                id="channel-id"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="123456789012345678"
                disabled={status.running}
                required
              />
              <div className="help-text">
                Right-click channel → Copy ID (Developer Mode must be enabled in Discord settings)
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="poll-interval">Poll Interval (ms)</label>
              <input
                type="number"
                id="poll-interval"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number.parseInt(e.target.value, 10))}
                min={500}
                max={10000}
                step={500}
                disabled={status.running}
              />
              <div className="help-text">How often to check for new events (default: 2000ms)</div>
            </div>

            <div className="button-group">
              {status.running ? (
                <button type="button" onClick={handleStop} className="button button-danger">
                  Stop Service
                </button>
              ) : (
                <button type="submit" className="button button-primary" disabled={!lockfileStatus.exists}>
                  Start Spectator Service
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ margin: 0 }}>Setup Instructions</h2>
            <button
              type="button"
              onClick={() => {
                setDebugPanelOpen(true);
              }}
              className="debug-toggle-button"
            >
              🐛 Debug Logs
            </button>
          </div>
          <ol className="instructions">
            <li>Make sure League of Legends client is running and you're logged in</li>
            <li>
              Create a Discord bot at{" "}
              <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                Discord Developer Portal
              </a>
            </li>
            <li>Enable "Message Content Intent" in the Bot section</li>
            <li>Invite the bot to your server with "Send Messages" permission</li>
            <li>Enable Developer Mode in Discord (User Settings → Advanced)</li>
            <li>Right-click your Discord channel and copy the Channel ID</li>
            <li>Enter your credentials above and click "Start Spectator Service"</li>
            <li>The service will automatically detect when you're in a game</li>
          </ol>
        </section>
      </div>

      <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
    </div>
  );
}
