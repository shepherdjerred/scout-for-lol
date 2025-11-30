import { Save, Mic, Play } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  StatusIndicator,
  Collapsible,
  Badge,
} from "@scout-for-lol/desktop/components/ui/index.ts";

type DiscordStatus = {
  connected: boolean;
  channelName: string | null;
  voiceConnected: boolean;
  voiceChannelName: string | null;
  activeSoundPack: string | null;
};

type DiscordSectionProps = {
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

const SOUND_EVENT_LABELS: Record<string, { label: string; description: string }> = {
  gameStart: { label: "Game Start", description: "When the game begins" },
  firstBlood: { label: "First Blood", description: "First kill of the game" },
  kill: { label: "Kill", description: "When you get a kill" },
  multiKill: { label: "Multi-kill", description: "Double, triple, quadra, penta" },
  objective: { label: "Objective", description: "Dragon, Baron, towers" },
  ace: { label: "Ace", description: "Team ace" },
  gameEnd: { label: "Game End", description: "Victory or defeat" },
};

export function DiscordSection({
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
}: DiscordSectionProps) {
  const isConfiguring = loading?.includes("Discord") ?? loading?.includes("Configuring");
  const isJoiningVoice = loading?.includes("voice") ?? loading?.includes("Voice");
  const isTestingSound = loading?.includes("sound") ?? loading?.includes("Sound");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-100">Discord Configuration</h2>
        <p className="text-gray-400">Set up your Discord bot to receive game updates and voice notifications</p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCard
          label="Text Channel"
          value={discordStatus.channelName ?? "Not configured"}
          connected={discordStatus.connected}
        />
        <StatusCard
          label="Voice Channel"
          value={discordStatus.voiceChannelName ?? "Not joined"}
          connected={discordStatus.voiceConnected}
        />
        <StatusCard label="Sound Pack" value={discordStatus.activeSoundPack ?? soundPack} connected={true} />
      </div>

      {/* Bot Configuration */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Bot Settings</CardTitle>
          <CardDescription>Configure your Discord bot connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Bot Token"
              type="password"
              value={botToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onBotTokenChange(e.target.value);
              }}
              placeholder="Your Discord bot token"
              helperText="Get this from Discord Developer Portal"
            />
            <Input
              label="Text Channel ID"
              value={channelId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onChannelIdChange(e.target.value);
              }}
              placeholder="e.g. 1234567890123456789"
              helperText="Right-click channel → Copy Channel ID"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Voice Channel ID"
              value={voiceChannelId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onVoiceChannelIdChange(e.target.value);
              }}
              placeholder="e.g. 1234567890123456789"
              helperText="Optional: For voice announcements"
            />
            <Select
              label="Sound Pack"
              value={soundPack}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                onSoundPackChange(e.target.value);
              }}
              helperText="Audio theme for notifications"
            >
              <option value="base">Base Pack (Synth tones)</option>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <Button onClick={onConfigure} loading={isConfiguring} icon={<Save className="h-4 w-4" />}>
            Save Settings
          </Button>
          <Button
            variant="secondary"
            onClick={onJoinVoice}
            loading={isJoiningVoice}
            disabled={!voiceChannelId || !discordStatus.connected}
            icon={<Mic className="h-4 w-4" />}
          >
            Join Voice
          </Button>
          <Button
            variant="outline"
            onClick={onTestSound}
            loading={isTestingSound}
            disabled={!discordStatus.voiceConnected}
            icon={<Play className="h-4 w-4" />}
          >
            Test Sound
          </Button>
        </CardFooter>
      </Card>

      {/* Advanced: Sound Event Mapping */}
      <Collapsible
        title="Advanced: Event Sound Mapping"
        badge={
          <Badge variant="default" className="text-[10px]">
            {Object.keys(eventSounds).filter((k) => eventSounds[k]).length}/{Object.keys(SOUND_EVENT_LABELS).length}
          </Badge>
        }
      >
        <p className="mb-5 text-sm text-gray-400">
          Customize sounds for specific game events. Use a sound pack key or a custom file path.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(SOUND_EVENT_LABELS).map(([key, { label, description }]) => (
            <div key={key} className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-200">{label}</span>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <input
                type="text"
                value={eventSounds[key] ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onEventSoundChange(key, e.target.value);
                }}
                placeholder={`e.g. ${key} or /path/to/sound.ogg`}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 transition-colors hover:border-gray-600 focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/30"
              />
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

function StatusCard({ label, value, connected }: { label: string; value: string; connected: boolean }) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <StatusIndicator
          status={connected ? "connected" : "disconnected"}
          label={connected ? "Active" : "Inactive"}
          className="text-[10px]"
        />
      </div>
      <p className="truncate text-sm font-medium text-gray-200">{value}</p>
    </div>
  );
}
