type LcuStatus = {
  connected: boolean;
  summonerName: string | null;
  inGame: boolean;
};

type DiscordStatus = {
  connected: boolean;
  channelName: string | null;
};

type LogEntry = {
  timestamp: string;
  level: "info" | "error" | "warning";
  message: string;
};

type LeagueClientSectionProps = {
  lcuStatus: LcuStatus;
  loading: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function LeagueClientSection({
  lcuStatus,
  loading,
  onConnect,
  onDisconnect,
}: LeagueClientSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">
        League Client
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <span
            className={
              lcuStatus.connected
                ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }
          >
            {lcuStatus.connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {lcuStatus.summonerName && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Summoner:
            </span>
            <span className="text-sm text-gray-900 dark:text-black">
              {lcuStatus.summonerName}
            </span>
          </div>
        )}

        <div className="mt-6">
          {!lcuStatus.connected ? (
            <button
              onClick={onConnect}
              disabled={loading !== null}
              className="w-full rounded-lg bg-discord-blurple px-4 py-3 font-medium text-black transition-colors hover:bg-discord-blurple/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Connect to League Client
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              disabled={loading !== null}
              className="w-full rounded-lg bg-gray-500 px-4 py-3 font-medium text-black transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

type DiscordConfigSectionProps = {
  discordStatus: DiscordStatus;
  loading: string | null;
  botToken: string;
  channelId: string;
  onBotTokenChange: (value: string) => void;
  onChannelIdChange: (value: string) => void;
  onConfigure: () => void;
};

export function DiscordConfigSection({
  discordStatus,
  loading,
  botToken,
  channelId,
  onBotTokenChange,
  onChannelIdChange,
  onConfigure,
}: DiscordConfigSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">
        Discord Configuration
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <span
            className={
              discordStatus.connected
                ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
            }
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
                  onBotTokenChange(e.target.value);
                }}
                placeholder="Your Discord bot token"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black dark:placeholder-gray-400"
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
                  onChannelIdChange(e.target.value);
                }}
                placeholder="Discord channel ID"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black dark:placeholder-gray-400"
              />
            </div>

            <button
              onClick={onConfigure}
              disabled={loading !== null}
              className="w-full rounded-lg bg-discord-blurple px-4 py-3 font-medium text-black transition-colors hover:bg-discord-blurple/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Configure Discord
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

type MonitoringSectionProps = {
  isMonitoring: boolean;
  loading: string | null;
  onStart: () => void;
  onStop: () => void;
  onTest?: () => void;
};

export function MonitoringSection({
  isMonitoring,
  loading,
  onStart,
  onStop,
  onTest,
}: MonitoringSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">
        Monitoring
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <span
            className={
              isMonitoring
                ? "rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
            }
          >
            {isMonitoring ? "Monitoring Active" : "Idle"}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {!isMonitoring ? (
            <button
              onClick={onStart}
              disabled={loading !== null}
              className="w-full rounded-lg bg-discord-green px-4 py-3 font-medium text-black transition-colors hover:bg-discord-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Monitoring
            </button>
          ) : (
            <>
              <button
                onClick={onStop}
                disabled={loading !== null}
                className="w-full rounded-lg bg-discord-red px-4 py-3 font-medium text-black transition-colors hover:bg-discord-red/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stop Monitoring
              </button>
              {onTest && (
                <button
                  onClick={onTest}
                  disabled={loading !== null}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Test Event Detection
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

type DebugPanelProps = {
  lcuStatus: LcuStatus;
  discordStatus: DiscordStatus;
  isMonitoring: boolean;
  logs: LogEntry[];
  onClearLogs: () => void;
};

function getLogColorClass(level: LogEntry["level"]): string {
  if (level === "error") {
    return "text-red-600 dark:text-red-400";
  }
  if (level === "warning") {
    return "text-yellow-600 dark:text-yellow-400";
  }
  return "text-gray-700 dark:text-gray-300";
}

export function DebugPanel({
  lcuStatus,
  discordStatus,
  isMonitoring,
  logs,
  onClearLogs,
}: DebugPanelProps) {
  return (
    <aside className="lg:w-96">
      <div className="sticky top-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-black">
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
                className={
                  lcuStatus.connected
                    ? "font-medium text-green-600 dark:text-green-400"
                    : "font-medium text-red-600 dark:text-red-400"
                }
              >
                {lcuStatus.connected ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Discord Configured:
              </span>
              <span
                className={
                  discordStatus.connected
                    ? "font-medium text-green-600 dark:text-green-400"
                    : "font-medium text-red-600 dark:text-red-400"
                }
              >
                {discordStatus.connected ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Monitoring:
              </span>
              <span
                className={
                  isMonitoring
                    ? "font-medium text-blue-600 dark:text-blue-400"
                    : "font-medium text-gray-600 dark:text-gray-400"
                }
              >
                {isMonitoring ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-black">
                Logs
              </h4>
              <button
                onClick={onClearLogs}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
            <div className="max-h-96 space-y-1 overflow-y-auto rounded-md bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
              {logs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No logs yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={getLogColorClass(log.level)}>
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
  );
}
