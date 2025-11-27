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
  activeSoundPack: string | null;
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

export function LeagueClientSection({ lcuStatus, loading, onConnect, onDisconnect }: LeagueClientSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">League Client</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
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
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Summoner:</span>
            <span className="text-sm text-gray-900 dark:text-black">{lcuStatus.summonerName}</span>
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
  voiceChannelId: string;
  soundPack: string;
  eventSounds: Record<string, string>;
  onBotTokenChange: (value: string) => void;
  onChannelIdChange: (value: string) => void;
  onVoiceChannelIdChange: (value: string) => void;
  onSoundPackChange: (value: string) => void;
  onEventSoundChange: (key: string, value: string) => void;
  onConfigure: () => void;
  onJoinVoice: () => void;
  onTestSound: () => void;
};

const SOUND_EVENT_LABELS: Record<string, string> = {
  gameStart: "Game start",
  firstBlood: "First blood",
  kill: "Kill",
  multiKill: "Multi-kill",
  objective: "Objective",
  ace: "Ace",
  gameEnd: "Game end",
};

export function DiscordConfigSection({
  discordStatus,
  loading,
  botToken,
  channelId,
  voiceChannelId,
  soundPack,
  eventSounds,
  onBotTokenChange,
  onChannelIdChange,
  onVoiceChannelIdChange,
  onSoundPackChange,
  onEventSoundChange,
  onConfigure,
  onJoinVoice,
  onTestSound,
}: DiscordConfigSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">Discord Configuration</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Text channel</span>
            <span
              className={
                discordStatus.connected
                  ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
              }
            >
              {discordStatus.connected ? "Configured" : "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Voice</span>
            <span
              className={
                discordStatus.voiceConnected
                  ? "rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : "rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
              }
            >
              {discordStatus.voiceConnected ? "Ready" : "Not joined"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sound pack</span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
              {discordStatus.activeSoundPack ?? "base"}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="bot-token" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <label htmlFor="channel-id" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Text Channel ID
              </label>
              <input
                id="channel-id"
                type="text"
                value={channelId}
                onChange={(e) => {
                  onChannelIdChange(e.target.value);
                }}
                placeholder="Discord text channel ID"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="voice-channel-id"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Voice Channel ID
              </label>
              <input
                id="voice-channel-id"
                type="text"
                value={voiceChannelId}
                onChange={(e) => {
                  onVoiceChannelIdChange(e.target.value);
                }}
                placeholder="Discord voice channel ID"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black dark:placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Provide a voice channel so the bot can join VC and play sounds.
              </p>
            </div>
            <div>
              <label htmlFor="sound-pack" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sound Pack
              </label>
              <select
                id="sound-pack"
                value={soundPack}
                onChange={(e) => {
                  onSoundPackChange(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black"
              >
                <option value="base">Base pack (synth tones)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Swap sound packs or override individual events below.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Event → sound mapping</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">Use a pack key or a file path</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(SOUND_EVENT_LABELS).map(([key, label]) => (
                <div key={key} className="space-y-1 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <label htmlFor={`event-sound-${key}`} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{key}</span>
                  </label>
                  <input
                    type="text"
                    value={eventSounds[key] ?? ""}
                    onChange={(e) => {
                      onEventSoundChange(key, e.target.value);
                    }}
                    placeholder="e.g. gameStart or /path/to/sound.ogg"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/20 dark:border-gray-700 dark:bg-gray-900 dark:text-black"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              onClick={onConfigure}
              disabled={loading !== null}
              className="w-full rounded-lg bg-discord-blurple px-4 py-3 font-medium text-black transition-colors hover:bg-discord-blurple/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Save Discord + Sound Settings
            </button>
            <button
              onClick={onJoinVoice}
              disabled={loading !== null || !voiceChannelId}
              className="w-full rounded-lg border border-blue-200 px-4 py-3 font-medium text-blue-800 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-900/20 md:w-auto"
            >
              Join Voice Channel
            </button>
            <button
              onClick={onTestSound}
              disabled={loading !== null}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/50 md:w-auto"
            >
              Play Test Sound
            </button>
          </div>
        </div>
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

export function MonitoringSection({ isMonitoring, loading, onStart, onStop, onTest }: MonitoringSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-black">Monitoring</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
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
  logPaths?: {
    app_log_dir: string;
    working_dir_log: string;
  } | null;
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

export function DebugPanel({ lcuStatus, discordStatus, isMonitoring, logs, logPaths, onClearLogs }: DebugPanelProps) {
  return (
    <aside className="lg:w-96">
      <div className="sticky top-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-black">Debug Panel</h3>
        </div>
        <div className="p-6">
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">LCU Connected:</span>
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
              <span className="text-gray-600 dark:text-gray-400">Discord Configured:</span>
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
              <span className="text-gray-600 dark:text-gray-400">Voice Connected:</span>
              <span
                className={
                  discordStatus.voiceConnected
                    ? "font-medium text-blue-600 dark:text-blue-300"
                    : "font-medium text-gray-600 dark:text-gray-400"
                }
              >
                {discordStatus.voiceConnected ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Monitoring:</span>
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
              <h4 className="text-sm font-semibold text-gray-900 dark:text-black">Logs</h4>
              <button
                onClick={onClearLogs}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
            {logPaths && (
              <div className="mb-2 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="break-words">Working dir log: {logPaths.working_dir_log}</div>
                <div className="break-words">App log dir: {logPaths.app_log_dir}</div>
              </div>
            )}
            <div className="max-h-96 space-y-1 overflow-y-auto rounded-md bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
              {logs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No logs yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={getLogColorClass(log.level)}>
                    <span className="text-gray-500 dark:text-gray-500">[{log.timestamp}]</span> {log.message}
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
