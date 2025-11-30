import { Bug, Trash2, FileText, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@scout-for-lol/desktop/components/ui/index.ts";

type LogEntry = {
  timestamp: string;
  level: "info" | "error" | "warning";
  message: string;
};

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
  onClose: () => void;
};

function getLogIcon(level: LogEntry["level"]) {
  switch (level) {
    case "error":
      return <AlertCircle className="h-3 w-3 text-discord-red" />;
    case "warning":
      return <AlertTriangle className="h-3 w-3 text-discord-yellow" />;
    case "info":
      return <Info className="h-3 w-3 text-gray-500" />;
  }
}

function getLogColorClass(level: LogEntry["level"]): string {
  switch (level) {
    case "error":
      return "text-discord-red";
    case "warning":
      return "text-discord-yellow";
    case "info":
      return "text-gray-400";
  }
}

export function DebugPanel({
  lcuStatus,
  discordStatus,
  isMonitoring,
  logs,
  logPaths,
  onClearLogs,
  onClose,
}: DebugPanelProps) {
  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900/80 backdrop-blur-sm animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-discord-blurple" />
          <h3 className="font-semibold text-gray-100">Debug Panel</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status Grid */}
      <div className="border-b border-gray-800 p-4">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Connection Status</h4>
        <div className="grid grid-cols-2 gap-2">
          <StatusItem label="LCU" value={lcuStatus.connected ? "Yes" : "No"} active={lcuStatus.connected} />
          <StatusItem label="Discord" value={discordStatus.connected ? "Yes" : "No"} active={discordStatus.connected} />
          <StatusItem
            label="Voice"
            value={discordStatus.voiceConnected ? "Yes" : "No"}
            active={discordStatus.voiceConnected}
          />
          <StatusItem label="Monitoring" value={isMonitoring ? "Yes" : "No"} active={isMonitoring} />
        </div>
      </div>

      {/* Log Paths */}
      {logPaths && (
        <div className="border-b border-gray-800 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            <FileText className="h-3 w-3" />
            Log Files
          </h4>
          <div className="space-y-1">
            <p className="break-all text-[11px] text-gray-500">
              <span className="text-gray-400">Working:</span> {logPaths.working_dir_log}
            </p>
            <p className="break-all text-[11px] text-gray-500">
              <span className="text-gray-400">App:</span> {logPaths.app_log_dir}
            </p>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Live Logs ({logs.length})</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLogs}
            className="!px-2 !py-1 text-xs"
            icon={<Trash2 className="h-3 w-3" />}
          >
            Clear
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="text-gray-500">
                <Bug className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No logs yet</p>
                <p className="text-xs">Events will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-xs">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 rounded px-2 py-1 hover:bg-gray-800/50 ${getLogColorClass(log.level)}`}
                >
                  <span className="mt-0.5 shrink-0">{getLogIcon(log.level)}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-600">[{log.timestamp}]</span>{" "}
                    <span className="break-words">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function StatusItem({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-800/50 px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${active ? "text-discord-green" : "text-gray-400"}`}>{value}</span>
    </div>
  );
}
