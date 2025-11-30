import { Gamepad2, MessageSquare, Activity, Bug, Swords } from "lucide-react";
import { StatusIndicator } from "@scout-for-lol/desktop/components/ui/index.ts";

type SidebarProps = {
  lcuConnected: boolean;
  discordConnected: boolean;
  voiceConnected: boolean;
  isMonitoring: boolean;
  activeSection: "league" | "discord" | "monitor";
  onSectionChange: (section: "league" | "discord" | "monitor") => void;
  showDebug: boolean;
  onToggleDebug: () => void;
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  status?: "connected" | "disconnected" | "active" | "idle";
  onClick: () => void;
  disabled?: boolean;
};

function NavItem({ icon, label, active, status, onClick, disabled }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group flex w-full items-center gap-3 rounded-lg px-3 py-2.5
        text-left text-sm font-medium transition-all duration-200
        ${active ? "bg-discord-blurple/20 text-discord-blurple" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <span className={active ? "text-discord-blurple" : "text-gray-500 group-hover:text-gray-300"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {status && (
        <StatusIndicator
          status={status}
          label={status === "connected" || status === "active" ? "●" : "○"}
          className="!px-1.5 !py-0 text-[10px]"
        />
      )}
    </button>
  );
}

export function Sidebar({
  lcuConnected,
  discordConnected,
  voiceConnected,
  isMonitoring,
  activeSection,
  onSectionChange,
  showDebug,
  onToggleDebug,
}: SidebarProps) {
  const canMonitor = lcuConnected && discordConnected;

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-800 bg-gray-900/50">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-discord-blurple to-lol-gold shadow-lg">
          <Swords className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-100">Scout</h1>
          <p className="text-xs text-gray-500">for League of Legends</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <NavItem
          icon={<Gamepad2 className="h-5 w-5" />}
          label="League Client"
          active={activeSection === "league"}
          status={lcuConnected ? "connected" : "disconnected"}
          onClick={() => {
            onSectionChange("league");
          }}
        />
        <NavItem
          icon={<MessageSquare className="h-5 w-5" />}
          label="Discord"
          active={activeSection === "discord"}
          status={discordConnected ? "connected" : "disconnected"}
          onClick={() => {
            onSectionChange("discord");
          }}
        />
        <NavItem
          icon={<Activity className="h-5 w-5" />}
          label="Monitoring"
          active={activeSection === "monitor"}
          status={isMonitoring ? "active" : "idle"}
          onClick={() => {
            onSectionChange("monitor");
          }}
          disabled={!canMonitor}
        />
      </nav>

      {/* Status Summary */}
      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</div>
        <div className="space-y-2">
          <StatusRow label="League" connected={lcuConnected} icon={<Gamepad2 className="h-3.5 w-3.5" />} />
          <StatusRow label="Discord" connected={discordConnected} icon={<MessageSquare className="h-3.5 w-3.5" />} />
          {voiceConnected && <StatusRow label="Voice" connected={true} icon={<Activity className="h-3.5 w-3.5" />} />}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={onToggleDebug}
          className={`
            flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm
            transition-colors
            ${showDebug ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"}
          `}
        >
          <Bug className="h-4 w-4" />
          <span>Debug Panel</span>
        </button>
      </div>
    </aside>
  );
}

function StatusRow({ label, connected, icon }: { label: string; connected: boolean; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-discord-green animate-pulse-slow" : "bg-gray-600"}`} />
        <span className={connected ? "text-discord-green" : "text-gray-500"}>{connected ? "On" : "Off"}</span>
      </div>
    </div>
  );
}
